// Fills the anonymous usage figures from /api/v1/stats (same origin, no cookie).
// Elements: [data-stats-band] (hidden until totals are public), [data-stat="files|videos|photos|parts"],
// [data-stats-since], [data-stats-pending], [data-stats-months] (a <tbody>).
(function () {
  var root = document.documentElement;
  var lang = root.lang === 'en' ? 'en-US' : 'fr-FR';
  var fmt = function (n) {
    return Number(n).toLocaleString(lang);
  };
  var monthName = function (m) {
    var parts = m.split('-');
    return new Date(Date.UTC(+parts[0], +parts[1] - 1, 1)).toLocaleDateString(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
  if (!document.querySelector('[data-stats-band],[data-stats-months],[data-stats-pending]')) return;

  fetch('/api/v1/stats', { credentials: 'omit' })
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (s) {
      if (!s || !s.totals) return;
      document.querySelectorAll('[data-stats-since]').forEach(function (el) {
        el.textContent = new Date(s.since + 'T00:00:00Z').toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
      });
      document.querySelectorAll('[data-stats-threshold]').forEach(function (el) {
        el.textContent = fmt(s.threshold);
      });
      if (!s.public) {
        document.querySelectorAll('[data-stats-pending]').forEach(function (el) {
          el.hidden = false;
        });
        return;
      }
      document.querySelectorAll('[data-stat]').forEach(function (el) {
        var v = s.totals[el.getAttribute('data-stat')];
        if (v !== undefined) el.textContent = fmt(v);
      });
      document.querySelectorAll('[data-stats-months]').forEach(function (tbody) {
        tbody.textContent = '';
        s.months
          .slice()
          .reverse()
          .forEach(function (m) {
            var tr = document.createElement('tr');
            tr.className = 'border-b border-wm-border last:border-0';
            [monthName(m.month), fmt(m.files), fmt(m.parts)].forEach(function (text, i) {
              var cell = document.createElement(i === 0 ? 'th' : 'td');
              if (i === 0) cell.setAttribute('scope', 'row');
              cell.className = 'px-4 py-3.5 sm:px-6' + (i === 0 ? ' font-semibold text-left' : ' tabular-nums');
              cell.textContent = text;
              tr.appendChild(cell);
            });
            tbody.appendChild(tr);
          });
      });
      document.querySelectorAll('[data-stats-band],[data-stats-ready]').forEach(function (el) {
        el.hidden = false;
      });
    })
    .catch(function () {});
})();
