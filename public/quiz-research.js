/* One same-origin request, initiated only by confirming a completed result. */
const quizAnalytics = {
  sink: '/api/quiz-research',
  submit(state, language) {
    if (state.researchConsent !== true || state.researchAttempted || !state.match || state.answers.length !== 10) return;
    state.researchAttempted = true;
    const payload = {
      consent: true, language, result_character: state.match,
      answers: state.answers.map(index => 'ABCD'[index])
    };
    try {
      void fetch(this.sink, {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload),
        signal: AbortSignal.timeout(6000), keepalive: true
      }).catch(() => {});
    } catch {}
  }
};
