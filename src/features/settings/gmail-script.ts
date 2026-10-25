// The Google Apps Script the user pastes into script.google.com (email-capture.md §0). It runs
// in their own Gmail every 5 minutes and sends job emails, inbox and sent, to /inbound/gmail.
// The API ignores emails it has already stored, so overlapping runs are harmless.

export function gmailCaptureScript({ endpoint, token }: { endpoint: string; token: string }) {
  return `/**
 * Mission Control: Gmail capture
 * Sends your job-application emails (inbox and sent) to Mission Control every 5 minutes.
 *
 * Setup: paste this into a new project at https://script.google.com, Save, pick "setup" in the
 * toolbar's function list and press Run. Approve access when Google asks.
 * Keep this script private: it contains your capture token.
 */
const CONFIG = {
  endpoint: ${JSON.stringify(endpoint)},
  token: ${JSON.stringify(token)},
  // How far back the first run looks.
  lookbackDays: 30,
};

// Job emails: confirmations from job sites and hiring tools, replies about applications, and
// CVs you sent yourself.
const SEARCH =
  '(from:(jobs-noreply@linkedin.com OR indeedapply@indeed.com OR rozee.pk OR mustakbil.com' +
  ' OR bayt.com OR workablemail.com OR greenhouse.io OR lever.co OR ashbyhq.com' +
  ' OR myworkday.com OR zohorecruit.com OR bamboohr.com)' +
  ' OR subject:("your application" OR "application received" OR "thank you for applying"' +
  ' OR "thanks for applying" OR shortlisted OR interview OR assessment OR "application for")' +
  ' OR (in:sent has:attachment (cv OR resume OR "curriculum vitae" OR applying OR application)))';

const LABEL = 'Mission Control';
const PAGE = 100; // threads per Gmail search page
const MAX_THREADS = 500; // per run: far more than a month of job emails
const BATCH = 5; // emails per request (each carries its HTML part)
const OVERLAP_MS = 10 * 60 * 1000;

/** Run once: installs the 5-minute trigger and does the first sync. */
function setup() {
  if (!CONFIG.token || CONFIG.token.indexOf('__') === 0) {
    throw new Error('Paste the script from Mission Control settings: it includes your token.');
  }
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === 'captureJobEmails')
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('captureJobEmails').timeBased().everyMinutes(5).create();
  if (!GmailApp.getUserLabelByName(LABEL)) GmailApp.createLabel(LABEL);
  // Start over: re-running setup resends the last lookbackDays (the API skips what it has).
  PropertiesService.getScriptProperties().deleteProperty('lastSyncMs');
  captureJobEmails();
  console.log('Set up. Mission Control now checks your Gmail every 5 minutes.');
}

/** Sends job emails received or sent since the last successful run. */
function captureJobEmails() {
  const props = PropertiesService.getScriptProperties();
  const startedAt = Date.now();
  const last = Number(props.getProperty('lastSyncMs')) || startedAt - CONFIG.lookbackDays * 864e5;
  const since = last - OVERLAP_MS;
  const me = Session.getActiveUser().getEmail().toLowerCase();
  const query = SEARCH + ' after:' + Math.floor(since / 1000);

  const threads = [];
  for (let start = 0; start < MAX_THREADS; start += PAGE) {
    const page = GmailApp.search(query, start, PAGE);
    page.forEach((t) => threads.push(t));
    if (page.length < PAGE) break;
  }

  const messages = [];
  threads.forEach((thread) => {
    thread.getMessages().forEach((m) => {
      if (m.getDate().getTime() >= since) messages.push(toPayload(m, thread, me));
    });
  });

  for (let i = 0; i < messages.length; i += BATCH) {
    const res = UrlFetchApp.fetch(CONFIG.endpoint, {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + CONFIG.token },
      payload: JSON.stringify({ messages: messages.slice(i, i + BATCH) }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) {
      // Stop without moving lastSyncMs: the next run retries from the same point.
      console.error('Mission Control answered ' + res.getResponseCode() + ': ' + res.getContentText());
      return;
    }
  }

  const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  for (let i = 0; i < threads.length; i += 100) label.addToThreads(threads.slice(i, i + 100));

  if (threads.length >= MAX_THREADS) {
    console.warn('Over ' + MAX_THREADS + ' conversations matched; older ones were skipped.');
  }
  props.setProperty('lastSyncMs', String(startedAt));
  console.log('Sent ' + messages.length + ' email(s) from ' + threads.length + ' conversation(s).');
}

function toPayload(m, thread, me) {
  const from = m.getFrom() || 'unknown';
  return {
    gmailId: m.getId(),
    threadId: thread.getId(),
    direction: from.toLowerCase().indexOf(me) !== -1 ? 'sent' : 'received',
    from: from.slice(0, 320),
    to: splitAddresses(m.getTo()).concat(splitAddresses(m.getCc())).slice(0, 50),
    subject: (m.getSubject() || '').slice(0, 1000),
    sentAt: m.getDate().toISOString(),
    text: (m.getPlainBody() || '').slice(0, 50000),
    html: shrinkHtml(m.getBody() || '').slice(0, 150000),
  };
}

// Styles, scripts and comments make up most of an email's HTML and carry no text.
function shrinkHtml(html) {
  return html
    .replace(/<!--[\\s\\S]*?-->/g, '')
    .replace(/<(style|script|head)\\b[\\s\\S]*?<\\/\\1>/gi, '')
    .replace(/\\s+/g, ' ');
}

// "A <a@x.com>, \\"B, Jr\\" <b@x.com>" -> ['A <a@x.com>', '"B, Jr" <b@x.com>']
function splitAddresses(value) {
  if (!value) return [];
  return (value.match(/(?:[^,"]|"[^"]*")+/g) || [])
    .map((s) => s.trim().slice(0, 320))
    .filter(Boolean);
}
`;
}
