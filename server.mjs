import http from 'node:http';

import {
  readFileSync,
  mkdirSync,
  realpathSync,
  readdirSync,
  statSync,
  createReadStream
} from 'node:fs';

import {
  basename,
  dirname,
  extname,
  join,
  relative,
  resolve,
  isAbsolute,
  sep
} from 'node:path';

import {
  fileURLToPath,
  pathToFileURL
} from 'node:url';

import { runInNewContext } from 'node:vm';
import { DatabaseSync } from 'node:sqlite';

const root = dirname(
  fileURLToPath(import.meta.url)
);

const publicRoot = join(
  root,
  'docs'
);

const context = {
  window: {}
};

for (
  const source of [
    'characters.js',
    'quiz-data.js'
  ]
) {
  runInNewContext(
    readFileSync(
      join(
        publicRoot,
        source
      ),
      'utf8'
    ),
    context,
    {
      filename: source
    }
  );
}

const quiz =
  context.window.PELUFI_QUIZ;

const mime = {
  '.html':
    'text/html; charset=utf-8',

  '.js':
    'text/javascript; charset=utf-8',

  '.css':
    'text/css; charset=utf-8',

  '.txt':
    'text/plain; charset=utf-8',

  '.webp':
    'image/webp',

  '.jpg':
    'image/jpeg',

  '.png':
    'image/png',

  '.ttf':
    'font/ttf',

  '.woff2':
    'font/woff2'
};

function staticRoutes(
  dir,
  prefix = '/',
  files = new Map()
) {
  for (
    const entry of readdirSync(
      dir,
      {
        withFileTypes: true
      }
    )
  ) {
    if (
      entry.name.startsWith('.') ||
      entry.isSymbolicLink()
    ) {
      continue;
    }

    const path =
      join(
        dir,
        entry.name
      );

    const route =
      prefix +
      entry.name;

    if (
      entry.isDirectory()
    ) {
      staticRoutes(
        path,
        route + '/',
        files
      );
    }

    if (
      entry.isFile() &&
      mime[extname(path)]
    ) {
      files.set(
        route,
        path
      );

      if (
        entry.name ===
        'index.html'
      ) {
        files.set(
          prefix,
          path
        );
      }
    }
  }

  return files;
}

function approvedRecord(
  data,
  now
) {
  if (
    !data ||
    typeof data !== 'object' ||

    Object.keys(data)
      .sort()
      .join(',') !==
      'adult_confirmed,answers,consent,language,result_character' ||

    data.adult_confirmed !==
      true ||

    data.consent !==
      true ||

    ![
      'en',
      'es',
      'it'
    ].includes(
      data.language
    ) ||

    !Array.isArray(
      data.answers
    ) ||

    data.answers.length !==
      10 ||

    !data.answers.every(
      a =>
        [
          'A',
          'B',
          'C',
          'D'
        ].includes(a)
    )
  ) {
    return null;
  }

  const scores =
    quiz.tally(
      data.answers.map(
        a =>
          'ABCD'.indexOf(a)
      )
    );

  if (
    !scores.leaders.includes(
      data.result_character
    )
  ) {
    return null;
  }

  const tie =
    scores.leaders.length > 2
      ? 'multi_tie'
      : scores.leaders.length === 2
        ? 'exact_tie'
        : scores.eligible.length > 1
          ? 'near_tie'
          : 'clear_winner';

  return [
    now
      .toISOString()
      .slice(
        0,
        10
      ),

    data.language,

    data.result_character,

    JSON.stringify(
      scores.characters
    ),

    JSON.stringify(
      scores.traits
    ),

    JSON.stringify(
      data.answers
    ),

    tie
  ];
}

export function createApp({
  dbPath =
    process.env.RESEARCH_DB ||
    join(
      root,
      'private',
      'research.sqlite'
    ),

  retentionMonths =
    Number(
      process.env
        .RESEARCH_RETENTION_MONTHS ||
      24
    ),

  clock =
    () => new Date()
} = {}) {
  if (
    !Number.isSafeInteger(
      retentionMonths
    ) ||
    retentionMonths < 1
  ) {
    throw Error(
      'Invalid research retention'
    );
  }

  const dbFile =
    resolve(dbPath);

  // Only the packaged public directory can be served.
  // Check the resolved DB location as well.
  const withinPublic =
    location => {
      const rel =
        relative(
          realpathSync(
            publicRoot
          ),
          location
        );

      return (
        !isAbsolute(rel) &&
        rel !== '..' &&
        !rel.startsWith(
          '..' + sep
        )
      );
    };

  if (
    withinPublic(
      dbFile
    )
  ) {
    throw Error(
      'Use private database storage'
    );
  }

  const files =
    staticRoutes(
      publicRoot
    );

  let db;

  function database() {
    if (!db) {
      mkdirSync(
        dirname(dbFile),
        {
          recursive: true,
          mode: 0o700
        }
      );

      if (
        withinPublic(
          join(
            realpathSync(
              dirname(dbFile)
            ),
            basename(
              dbFile
            )
          )
        )
      ) {
        throw Error(
          'Use private database storage'
        );
      }

      const handle =
        new DatabaseSync(
          dbFile
        );

      try {
        handle.exec(`
          PRAGMA busy_timeout=1500;
          PRAGMA secure_delete=ON;

          CREATE TABLE IF NOT EXISTS records (
            date TEXT NOT NULL,
            language TEXT NOT NULL,
            result_character TEXT NOT NULL,
            character_scores TEXT NOT NULL,
            trait_scores TEXT NOT NULL,
            answers TEXT NOT NULL,
            result_type TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS records_by_date
          ON records(date)
        `);

        db = handle;
      } catch (error) {
        handle.close();
        throw error;
      }
    }

    return db;
  }

  function purge() {
    database()
      .prepare(
        "DELETE FROM records WHERE date <= date(?, ?, 'floor')"
      )
      .run(
        clock()
          .toISOString()
          .slice(
            0,
            10
          ),

        '-' +
          retentionMonths +
          ' months'
      );
  }

  const purgeQuietly =
    () => {
      try {
        purge();
      } catch {
        /* Research outages leave the site available. */
      }
    };

  purgeQuietly();

  const cleanup =
    setInterval(
      purgeQuietly,
      24 *
        60 *
        60 *
        1000
    ).unref();

  const server =
    http.createServer(
      async (
        req,
        res
      ) => {
        const finish =
          status => {
            res.writeHead(
              status
            );

            res.end();
          };

        try {
          const route =
            (
              req.url || ''
            ).split('?')[0];

          if (
            route ===
            '/api/quiz-research'
          ) {
            res.setHeader(
              'Cache-Control',
              'no-store'
            );

            const origin =
              req.headers.origin;

            const allowedOrigin =
              'https://pelufi.com';

            if (
              origin &&
              origin !==
                allowedOrigin
            ) {
              return finish(
                403
              );
            }

            if (
              origin ===
              allowedOrigin
            ) {
              res.setHeader(
                'Access-Control-Allow-Origin',
                allowedOrigin
              );

              res.setHeader(
                'Vary',
                'Origin'
              );

              res.setHeader(
                'Access-Control-Allow-Methods',
                'POST, OPTIONS'
              );

              res.setHeader(
                'Access-Control-Allow-Headers',
                'Content-Type'
              );
            }

            if (
              req.method ===
              'OPTIONS'
            ) {
              return finish(
                204
              );
            }

            if (
              req.method !==
              'POST'
            ) {
              return finish(
                405
              );
            }

            if (
              (
                req.headers[
                  'content-type'
                ] ||
                ''
              )
                .split(';')[0]
                .trim()
                .toLowerCase() !==
              'application/json'
            ) {
              return finish(
                415
              );
            }

            let size = 0;

            const chunks =
              [];

            for await (
              const chunk of req
            ) {
              size +=
                chunk.length;

              if (
                size > 2048
              ) {
                return finish(
                  413
                );
              }

              chunks.push(
                chunk
              );
            }

            let body;

            try {
              body =
                JSON.parse(
                  Buffer
                    .concat(
                      chunks
                    )
                    .toString(
                      'utf8'
                    )
                );
            } catch {
              return finish(
                400
              );
            }

            const row =
              approvedRecord(
                body,
                clock()
              );

            if (!row) {
              return finish(
                400
              );
            }

            database()
              .prepare(`
                INSERT INTO records (
                  date,
                  language,
                  result_character,
                  character_scores,
                  trait_scores,
                  answers,
                  result_type
                )
                VALUES (
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?,
                  ?
                )
              `)
              .run(
                ...row
              );

            return finish(
              204
            );
          }

          if (
            ![
              'GET',
              'HEAD'
            ].includes(
              req.method
            )
          ) {
            return finish(
              405
            );
          }

          if (
            !files.has(
              route
            ) &&
            files.has(
              route + '/'
            )
          ) {
            res.writeHead(
              308,
              {
                Location:
                  route +
                  '/' +
                  (
                    req.url.includes(
                      '?'
                    )
                      ? req.url.slice(
                          req.url.indexOf(
                            '?'
                          )
                        )
                      : ''
                  )
              }
            );

            return res.end();
          }

          const file =
            files.get(
              route
            );

          if (!file) {
            return finish(
              404
            );
          }

          res.writeHead(
            200,
            {
              'Content-Type':
                mime[
                  extname(
                    file
                  )
                ],

              'Content-Length':
                statSync(
                  file
                ).size,

              'X-Content-Type-Options':
                'nosniff'
            }
          );

          if (
            req.method ===
            'HEAD'
          ) {
            return res.end();
          }

          createReadStream(
            file
          )
            .on(
              'error',
              () =>
                res.destroy()
            )
            .pipe(
              res
            );
        } catch {
          if (
            !res.headersSent
          ) {
            finish(
              503
            );
          } else {
            res.destroy();
          }
        }
      }
    );

  server.on(
    'close',
    () => {
      clearInterval(
        cleanup
      );

      db?.close();
    }
  );

  return server;
}

if (
  process.argv[1] &&
  pathToFileURL(
    resolve(
      process.argv[1]
    )
  ).href ===
    import.meta.url
) {
  createApp()
    .listen(
      Number(
        process.env.PORT ||
        3000
      ),

      process.env.HOST ||
        '127.0.0.1',

      () =>
        console.log(
          'PELUFI server ready.'
        )
    );
}