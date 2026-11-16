import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { runInNewContext } from 'node:vm';
import { createApp } from './server.mjs';

test(
  '18+ research consent gate, computed scores, minimal storage, expiry and independent static service',
  async t => {
    const dir = mkdtempSync(
      join(tmpdir(), 'pelufi-qa-')
    );

    const file = join(
      dir,
      'db.sqlite'
    );

    t.after(() =>
      rmSync(
        dir,
        {
          recursive: true,
          force: true
        }
      )
    );

    const now = () =>
      new Date(
        '2026-11-14T12:00:00Z'
      );

    async function start(options) {
      const app =
        createApp(options);

      app.listen(
        0,
        '127.0.0.1'
      );

      await once(
        app,
        'listening'
      );

      const url =
        'http://127.0.0.1:' +
        app.address().port;

      return {
        app,
        url,

        stop: () =>
          new Promise(
            resolve =>
              app.close(resolve)
          )
      };
    }

    const site =
      await start({
        dbPath: file,
        clock: now
      });

    t.after(() =>
      site.app.listening
        ? site.stop()
        : undefined
    );

    const context = {
      window: {}
    };

    const pub = join(
      dirname(
        fileURLToPath(
          import.meta.url
        )
      ),
      'docs'
    );

    for (
      const name of [
        'characters.js',
        'quiz-data.js'
      ]
    ) {
      runInNewContext(
        readFileSync(
          join(
            pub,
            name
          ),
          'utf8'
        ),
        context
      );
    }

    const d =
      context.window.PELUFI_QUIZ;

    const send = (
      body,
      headers = {}
    ) =>
      fetch(
        site.url +
          '/api/quiz-research',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            ...headers
          },

          body:
            JSON.stringify(body)
        }
      );

    const types =
      new Set();

    for (
      const seq of [
        'AAAAAAAAAA',
        'CAAAAAAAAA',
        'BAAAAAAAAA',
        'BCAAAAAAAA',
        'DBBBAAAAAA',
        'ABBBBCBAAA'
      ]
    ) {
      const answers =
        Array.from(seq);

      const scores =
        d.tally(
          answers.map(
            a =>
              'ABCD'.indexOf(a)
          )
        );

      const base = {
        adult_confirmed: true,
        consent: true,
        language: 'it',
        result_character:
          scores.leaders.at(-1),
        answers
      };

      // Research must never be accepted without explicit 18+ confirmation.
      assert.equal(
        (
          await send({
            ...base,
            adult_confirmed: false
          })
        ).status,
        400
      );

      assert.equal(
        (
          await send({
            consent: true,
            language:
              base.language,
            result_character:
              base.result_character,
            answers:
              base.answers
          })
        ).status,
        400
      );

      // Research must never be accepted without explicit consent.
      assert.equal(
        (
          await send({
            ...base,
            consent: false
          })
        ).status,
        400
      );

      // Unexpected fields must be rejected.
      assert.equal(
        (
          await send({
            ...base,
            email:
              'test@example.com'
          })
        ).status,
        400
      );

      // Invalid result must be rejected.
      assert.equal(
        (
          await send({
            ...base,
            result_character:
              'invalid'
          })
        ).status,
        400
      );

      // Cross-origin research requests must be rejected.
      assert.equal(
        (
          await send(
            base,
            {
              Origin:
                'https://other.example'
            }
          )
        ).status,
        403
      );

      // Valid 18+ consensual research record.
      assert.equal(
        (
          await send(base)
        ).status,
        204
      );

      const db =
        new DatabaseSync(file);

      const last =
        db
          .prepare(
            `
            SELECT *
            FROM records
            ORDER BY rowid DESC
            LIMIT 1
            `
          )
          .get();

      // Only the intentionally minimal research dataset is stored.
      assert.deepEqual(
        Object.keys(last),
        [
          'date',
          'language',
          'result_character',
          'character_scores',
          'trait_scores',
          'answers',
          'result_type'
        ]
      );

      assert.equal(
        last.date,
        '2026-11-14'
      );

      assert.equal(
        last.language,
        base.language
      );

      assert.equal(
        last.result_character,
        base.result_character
      );

      assert.equal(
        last.character_scores,
        JSON.stringify(
          scores.characters
        )
      );

      assert.equal(
        last.trait_scores,
        JSON.stringify(
          scores.traits
        )
      );

      assert.equal(
        last.answers,
        JSON.stringify(
          answers
        )
      );

      types.add(
        last.result_type
      );

      db.close();
    }

    assert.equal(
      types.size,
      4,
      JSON.stringify(
        [...types]
      )
    );

    // Public static pages remain available.
    for (
      const path of [
        '/',
        '/quiz/',
        '/legal/',
        '/privacy/'
      ]
    ) {
      assert.equal(
        (
          await fetch(
            site.url + path
          )
        ).status,
        200
      );
    }

    // Private/server resources must never be publicly served.
    for (
      const path of [
        '/server.mjs',
        '/private/research.sqlite',
        '/api/quiz-research'
      ]
    ) {
      assert.notEqual(
        (
          await fetch(
            site.url + path
          )
        ).status,
        200
      );
    }

    await site.stop();

    let db =
      new DatabaseSync(file);

    // Exactly six valid research records were inserted.
    assert.equal(
      db
        .prepare(
          `
          SELECT count(*) AS n
          FROM records
          `
        )
        .get()
        .n,
      6
    );

    // Prepare retention test.
    db.exec(`
      UPDATE records
      SET date='2024-11-14'
      WHERE rowid=1;

      UPDATE records
      SET date='2024-11-15'
      WHERE rowid=2
    `);

    db.close();

    const restarted =
      await start({
        dbPath: file,
        clock: now
      });

    await restarted.stop();

    db =
      new DatabaseSync(file);

    // Record exactly at or beyond the configured retention limit is removed.
    assert.equal(
      db
        .prepare(
          `
          SELECT count(*) AS n
          FROM records
          `
        )
        .get()
        .n,
      5
    );

    db.close();

    // Research storage failure must not break the public website.
    const broken = join(
      dir,
      'blocked'
    );

    writeFileSync(
      broken,
      'test'
    );

    const outage =
      await start({
        dbPath:
          join(
            broken,
            'unusable.sqlite'
          ),

        clock: now
      });

    assert.equal(
      (
        await fetch(
          outage.url +
            '/quiz/'
        )
      ).status,
      200
    );

    const answers =
      Array(10).fill('A');

    const result_character =
      d
        .tally(
          Array(10).fill(0)
        )
        .leaders[0];

    assert.equal(
      (
        await fetch(
          outage.url +
            '/api/quiz-research',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                adult_confirmed:
                  true,

                consent:
                  true,

                language:
                  'it',

                answers,

                result_character
              })
          }
        )
      ).status,
      503
    );

    await outage.stop();
  }
);
