import { timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

function credentials(req) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Basic ')) return null;

  try {
    const decoded = Buffer
      .from(header.slice(6), 'base64')
      .toString('utf8');

    const split = decoded.indexOf(':');

    if (split < 0) return null;

    return {
      user: decoded.slice(0, split),
      password: decoded.slice(split + 1)
    };
  } catch {
    return null;
  }
}

function authorized(req, user, password) {
  if (!user || !password) return false;

  const supplied = credentials(req);

  return Boolean(
    supplied &&
    safeEqual(supplied.user, user) &&
    safeEqual(supplied.password, password)
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function csvCell(value) {
  const text =
    value == null
      ? ''
      : String(value);

  return /[",\r\n]/.test(text)
    ? `"${text.replaceAll('"', '""')}"`
    : text;
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function inc(map, key, amount = 1) {
  map.set(
    key,
    (map.get(key) || 0) + amount
  );
}

function sortedEntries(map) {
  return [...map.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        String(a[0]).localeCompare(
          String(b[0])
        )
    );
}

function titleize(value) {
  return String(value)
    .replaceAll('_', ' ')
    .replace(
      /\b\w/g,
      char => char.toUpperCase()
    );
}

function aggregate(rows) {
  const characters = new Map();
  const languages = new Map();
  const resultTypes = new Map();
  const daily = new Map();

  const answerCounts =
    Array.from(
      { length: 10 },
      () =>
        new Map([
          ['A', 0],
          ['B', 0],
          ['C', 0],
          ['D', 0]
        ])
    );

  const characterScoreSums =
    new Map();

  const characterScoreCounts =
    new Map();

  const traitScoreSums =
    new Map();

  const traitScoreCounts =
    new Map();

  for (const row of rows) {
    inc(
      characters,
      row.result_character
    );

    inc(
      languages,
      row.language
    );

    inc(
      resultTypes,
      row.result_type
    );

    inc(
      daily,
      row.date
    );

    const answers =
      parseJson(
        row.answers,
        []
      );

    answers
      .slice(0, 10)
      .forEach(
        (answer, index) => {
          if (
            [
              'A',
              'B',
              'C',
              'D'
            ].includes(answer)
          ) {
            inc(
              answerCounts[index],
              answer
            );
          }
        }
      );

    const characterScores =
      parseJson(
        row.character_scores,
        {}
      );

    for (
      const [
        key,
        raw
      ] of Object.entries(
        characterScores
      )
    ) {
      const value = Number(raw);

      if (
        !Number.isFinite(value)
      ) {
        continue;
      }

      inc(
        characterScoreSums,
        key,
        value
      );

      inc(
        characterScoreCounts,
        key
      );
    }

    const traitScores =
      parseJson(
        row.trait_scores,
        {}
      );

    for (
      const [
        key,
        raw
      ] of Object.entries(
        traitScores
      )
    ) {
      const value = Number(raw);

      if (
        !Number.isFinite(value)
      ) {
        continue;
      }

      inc(
        traitScoreSums,
        key,
        value
      );

      inc(
        traitScoreCounts,
        key
      );
    }
  }

  const averages =
    (
      sums,
      counts
    ) =>
      new Map(
        [...sums.entries()]
          .map(
            ([key, sum]) => [
              key,
              sum /
                (
                  counts.get(key) ||
                  1
                )
            ]
          )
      );

  return {
    total: rows.length,
    characters,
    languages,
    resultTypes,
    daily,
    answerCounts,

    characterAverages:
      averages(
        characterScoreSums,
        characterScoreCounts
      ),

    traitAverages:
      averages(
        traitScoreSums,
        traitScoreCounts
      )
  };
}

function percent(
  value,
  total
) {
  if (!total) {
    return '0.0';
  }

  return (
    (
      value /
      total
    ) *
    100
  ).toFixed(1);
}

function distributionTable(
  title,
  entries,
  total,
  label =
    value =>
      titleize(value)
) {
  const body =
    entries.length
      ? entries
          .map(
            ([key, count]) => `
              <tr>
                <td>${escapeHtml(
                  label(key)
                )}</td>

                <td>${count}</td>

                <td>
                  ${percent(
                    count,
                    total
                  )}%
                </td>

                <td>
                  <div class="bar">
                    <span
                      style="width:${percent(
                        count,
                        total
                      )}%"
                    ></span>
                  </div>
                </td>
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td colspan="4">
              No data yet.
            </td>
          </tr>
        `;

  return `
    <section class="panel">
      <h2>
        ${escapeHtml(title)}
      </h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Value</th>
              <th>Count</th>
              <th>Share</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function averageTable(
  title,
  averages
) {
  const entries =
    [...averages.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          a[0].localeCompare(
            b[0]
          )
      );

  const body =
    entries.length
      ? entries
          .map(
            ([key, value]) => `
              <tr>
                <td>
                  ${escapeHtml(
                    titleize(key)
                  )}
                </td>

                <td>
                  ${value.toFixed(2)}
                </td>
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td colspan="2">
              No data yet.
            </td>
          </tr>
        `;

  return `
    <section class="panel">
      <h2>
        ${escapeHtml(title)}
      </h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Average score</th>
            </tr>
          </thead>

          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function answerTables(
  answerCounts,
  total
) {
  return answerCounts
    .map(
      (counts, index) => {
        const rows =
          [
            'A',
            'B',
            'C',
            'D'
          ]
            .map(
              answer => {
                const count =
                  counts.get(
                    answer
                  ) || 0;

                return `
                  <tr>
                    <td>
                      ${answer}
                    </td>

                    <td>
                      ${count}
                    </td>

                    <td>
                      ${percent(
                        count,
                        total
                      )}%
                    </td>

                    <td>
                      <div class="bar">
                        <span
                          style="width:${percent(
                            count,
                            total
                          )}%"
                        ></span>
                      </div>
                    </td>
                  </tr>
                `;
              }
            )
            .join('');

        return `
          <section class="panel question">
            <h2>
              Q${index + 1}
            </h2>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Answer</th>
                    <th>Count</th>
                    <th>Share</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  ${rows}
                </tbody>
              </table>
            </div>
          </section>
        `;
      }
    )
    .join('');
}

function dailyTable(daily) {
  const entries =
    [...daily.entries()]
      .sort(
        (a, b) =>
          b[0].localeCompare(
            a[0]
          )
      );

  const max =
    Math.max(
      1,
      ...entries.map(
        ([, count]) =>
          count
      )
    );

  const rows =
    entries.length
      ? entries
          .map(
            ([date, count]) => `
              <tr>
                <td>
                  ${escapeHtml(date)}
                </td>

                <td>
                  ${count}
                </td>

                <td>
                  <div class="bar">
                    <span
                      style="width:${(
                        (
                          count /
                          max
                        ) *
                        100
                      ).toFixed(1)}%"
                    ></span>
                  </div>
                </td>
              </tr>
            `
          )
          .join('')
      : `
          <tr>
            <td colspan="3">
              No data yet.
            </td>
          </tr>
        `;

  return `
    <section class="panel">
      <h2>
        Daily completions
      </h2>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date (UTC)</th>
              <th>Records</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function recentTable(rows) {
  const recent =
    rows
      .slice(-50)
      .reverse();

  const body =
    recent.length
      ? recent
          .map(
            row => {
              const answers =
                parseJson(
                  row.answers,
                  []
                );

              return `
                <tr>
                  <td>
                    ${escapeHtml(
                      row.date
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      row.language
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      titleize(
                        row.result_character
                      )
                    )}
                  </td>

                  <td>
                    ${escapeHtml(
                      titleize(
                        row.result_type
                      )
                    )}
                  </td>

                  <td class="answers">
                    ${escapeHtml(
                      answers.join(' ')
                    )}
                  </td>
                </tr>
              `;
            }
          )
          .join('')
      : `
          <tr>
            <td colspan="5">
              No data yet.
            </td>
          </tr>
        `;

  return `
    <section class="panel wide">
      <div class="section-head">
        <h2>
          Latest anonymous records
        </h2>

        <span>
          Last ${Math.min(
            50,
            rows.length
          )} records
        </span>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Language</th>
              <th>Result</th>
              <th>Type</th>
              <th>Q1–Q10</th>
            </tr>
          </thead>

          <tbody>
            ${body}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderDashboard(rows) {
  const stats =
    aggregate(rows);

  const characterEntries =
    sortedEntries(
      stats.characters
    );

  const languageEntries =
    sortedEntries(
      stats.languages
    );

  const typeEntries =
    sortedEntries(
      stats.resultTypes
    );

  const topCharacter =
    characterEntries[0]?.[0] ||
    '—';

  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const todayCount =
    stats.daily.get(
      today
    ) || 0;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  >

  <meta
    name="robots"
    content="noindex,nofollow,noarchive"
  >

  <title>
    PELUFI Research Dashboard
  </title>

  <style>
    :root {
      font-family:
        Inter,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      color: #251529;
      background: #fff9f4;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;

      background:
        linear-gradient(
          180deg,
          #fff9f4,
          #f7eef9
        );

      min-height: 100vh;
    }

    .shell {
      max-width: 1440px;
      margin: auto;
      padding: 28px;
    }

    header {
      display: flex;
      gap: 20px;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .eyebrow {
      font-size: .76rem;
      text-transform: uppercase;
      letter-spacing: .12em;
      font-weight: 800;
      color: #9b3971;
    }

    h1 {
      margin: .15rem 0;

      font-size:
        clamp(
          2rem,
          4vw,
          3.5rem
        );
    }

    p {
      color: #6e5b6d;
    }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .button {
      display: inline-block;
      text-decoration: none;
      color: #fff;
      background: #35132e;
      padding: 10px 14px;
      border-radius: 12px;
      font-weight: 750;
    }

    .button.secondary {
      background: #fff;
      color: #35132e;
      border: 1px solid #e5d5df;
    }

    .cards {
      display: grid;

      grid-template-columns:
        repeat(
          4,
          minmax(0, 1fr)
        );

      gap: 14px;
      margin: 20px 0;
    }

    .card,
    .panel {
      background:
        rgba(
          255,
          255,
          255,
          .92
        );

      border:
        1px solid #eadce5;

      border-radius: 18px;

      box-shadow:
        0 10px 30px
        rgba(
          80,
          30,
          66,
          .06
        );
    }

    .card {
      padding: 18px;
    }

    .card strong {
      display: block;
      font-size: 2rem;
    }

    .card span {
      color: #766170;
    }

    .grid {
      display: grid;

      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap: 16px;
    }

    .panel {
      padding: 18px;
      overflow: hidden;
    }

    .panel.wide {
      grid-column: 1 / -1;
    }

    .panel h2 {
      margin: 0 0 14px;
      font-size: 1.05rem;
    }

    .questions {
      display: grid;

      grid-template-columns:
        repeat(
          2,
          minmax(0, 1fr)
        );

      gap: 16px;
    }

    .table-wrap {
      overflow: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: .92rem;
    }

    th,
    td {
      padding: 9px 8px;

      border-bottom:
        1px solid #efe4eb;

      text-align: left;
      white-space: nowrap;
    }

    th {
      font-size: .75rem;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #816b7b;
    }

    .bar {
      height: 8px;
      background: #f1e5ec;
      border-radius: 999px;
      min-width: 100px;
      overflow: hidden;
    }

    .bar span {
      display: block;
      height: 100%;

      background:
        linear-gradient(
          90deg,
          #d92d8a,
          #6e4cff
        );

      border-radius: inherit;
    }

    .answers {
      font-family:
        ui-monospace,
        SFMono-Regular,
        Menlo,
        monospace;

      letter-spacing: .08em;
    }

    .section-head {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
    }

    .section-head span {
      color: #806c7b;
      font-size: .85rem;
    }

    .notice {
      margin-top: 18px;
      font-size: .85rem;
      color: #806c7b;
    }

    @media (
      max-width: 900px
    ) {
      .cards,
      .grid,
      .questions {
        grid-template-columns:
          1fr 1fr;
      }
    }

    @media (
      max-width: 640px
    ) {
      .shell {
        padding: 16px;
      }

      .cards,
      .grid,
      .questions {
        grid-template-columns:
          1fr;
      }

      header {
        display: block;
      }

      .actions {
        margin-top: 16px;
      }
    }
  </style>
</head>

<body>
  <main class="shell">
    <header>
      <div>
        <div class="eyebrow">
          Private · Anonymous research
        </div>

        <h1>
          PELUFI Research
        </h1>

        <p>
          Aggregated quiz research.
          No names, emails or persistent
          visitor identifiers are stored
          in this dataset.
        </p>
      </div>

      <div class="actions">
        <a
          class="button secondary"
          href="/admin/research"
        >
          Refresh
        </a>

        <a
          class="button"
          href="/admin/research.csv"
        >
          Download CSV
        </a>
      </div>
    </header>

    <section class="cards">
      <div class="card">
        <strong>
          ${stats.total}
        </strong>

        <span>
          Total research records
        </span>
      </div>

      <div class="card">
        <strong>
          ${todayCount}
        </strong>

        <span>
          Today (UTC)
        </span>
      </div>

      <div class="card">
        <strong>
          ${escapeHtml(
            titleize(
              topCharacter
            )
          )}
        </strong>

        <span>
          Most common result
        </span>
      </div>

      <div class="card">
        <strong>
          ${stats.languages.size}
        </strong>

        <span>
          Languages represented
        </span>
      </div>
    </section>

    <section class="grid">
      ${distributionTable(
        'Result characters',
        characterEntries,
        stats.total
      )}

      ${distributionTable(
        'Languages',
        languageEntries,
        stats.total,
        value =>
          String(value)
            .toUpperCase()
      )}

      ${distributionTable(
        'Result types',
        typeEntries,
        stats.total
      )}

      ${dailyTable(
        stats.daily
      )}

      ${averageTable(
        'Average character scores',
        stats.characterAverages
      )}

      ${averageTable(
        'Average trait scores',
        stats.traitAverages
      )}
    </section>

    <h2 style="margin-top:28px">
      Answers by question
    </h2>

    <section class="questions">
      ${answerTables(
        stats.answerCounts,
        stats.total
      )}
    </section>

    <section
      class="grid"
      style="margin-top:16px"
    >
      ${recentTable(rows)}
    </section>

    <p class="notice">
      Retention is controlled by
      RESEARCH_RETENTION_MONTHS on the
      backend. CSV export contains the
      same anonymous research fields
      stored in SQLite, expanded into
      analysis-friendly columns.
    </p>
  </main>
</body>
</html>`;
}

function renderCsv(rows) {
  const parsed =
    rows.map(
      row => ({
        ...row,

        answersParsed:
          parseJson(
            row.answers,
            []
          ),

        characterScoresParsed:
          parseJson(
            row.character_scores,
            {}
          ),

        traitScoresParsed:
          parseJson(
            row.trait_scores,
            {}
          )
      })
    );

  const characterKeys =
    [
      ...new Set(
        parsed.flatMap(
          row =>
            Object.keys(
              row.characterScoresParsed
            )
        )
      )
    ].sort();

  const traitKeys =
    [
      ...new Set(
        parsed.flatMap(
          row =>
            Object.keys(
              row.traitScoresParsed
            )
        )
      )
    ].sort();

  const header = [
    'date',
    'language',
    'result_character',
    'result_type',

    ...Array.from(
      { length: 10 },
      (_, index) =>
        `q${index + 1}`
    ),

    ...characterKeys.map(
      key =>
        `character_${key}`
    ),

    ...traitKeys.map(
      key =>
        `trait_${key}`
    )
  ];

  const lines = [
    header
      .map(csvCell)
      .join(',')
  ];

  for (
    const row of parsed
  ) {
    const values = [
      row.date,
      row.language,
      row.result_character,
      row.result_type,

      ...Array.from(
        { length: 10 },
        (_, index) =>
          row.answersParsed[index] ||
          ''
      ),

      ...characterKeys.map(
        key =>
          row
            .characterScoresParsed[
              key
            ] ?? ''
      ),

      ...traitKeys.map(
        key =>
          row
            .traitScoresParsed[
              key
            ] ?? ''
      )
    ];

    lines.push(
      values
        .map(csvCell)
        .join(',')
    );
  }

  return (
    lines.join('\r\n') +
    '\r\n'
  );
}

function securityHeaders(res) {
  res.setHeader(
    'Cache-Control',
    'no-store'
  );

  res.setHeader(
    'X-Content-Type-Options',
    'nosniff'
  );

  res.setHeader(
    'X-Frame-Options',
    'DENY'
  );

  res.setHeader(
    'Referrer-Policy',
    'no-referrer'
  );

  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  );
}

export function handleResearchAdmin({
  req,
  res,
  route,
  db,
  adminUser,
  adminPassword
}) {
  if (
    ![
      '/admin/research',
      '/admin/research.csv'
    ].includes(route)
  ) {
    return false;
  }

  securityHeaders(res);

  if (
    !adminUser ||
    !adminPassword
  ) {
    res.writeHead(
      503,
      {
        'Content-Type':
          'text/plain; charset=utf-8'
      }
    );

    res.end(
      'Research administration is not configured.'
    );

    return true;
  }

  if (
    !authorized(
      req,
      adminUser,
      adminPassword
    )
  ) {
    res.setHeader(
      'WWW-Authenticate',
      'Basic realm="PELUFI Research", charset="UTF-8"'
    );

    res.writeHead(
      401,
      {
        'Content-Type':
          'text/plain; charset=utf-8'
      }
    );

    res.end(
      'Authentication required.'
    );

    return true;
  }

  if (
    ![
      'GET',
      'HEAD'
    ].includes(
      req.method
    )
  ) {
    res.writeHead(
      405,
      {
        Allow:
          'GET, HEAD'
      }
    );

    res.end();

    return true;
  }

  const rows =
    db.prepare(`
      SELECT
        date,
        language,
        result_character,
        character_scores,
        trait_scores,
        answers,
        result_type
      FROM records
      ORDER BY rowid ASC
    `).all();

  if (
    route ===
    '/admin/research.csv'
  ) {
    const csv =
      renderCsv(rows);

    res.writeHead(
      200,
      {
        'Content-Type':
          'text/csv; charset=utf-8',

        'Content-Disposition':
          'attachment; filename="pelufi-research.csv"',

        'Content-Length':
          Buffer.byteLength(
            csv
          )
      }
    );

    if (
      req.method ===
      'HEAD'
    ) {
      return res.end();
    }

    res.end(csv);

    return true;
  }

  const html =
    renderDashboard(rows);

  res.writeHead(
    200,
    {
      'Content-Type':
        'text/html; charset=utf-8',

      'Content-Length':
        Buffer.byteLength(
          html
        )
    }
  );

  if (
    req.method ===
    'HEAD'
  ) {
    return res.end();
  }

  res.end(html);

  return true;
}