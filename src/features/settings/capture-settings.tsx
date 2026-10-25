'use client';

import { Check, Copy, MailCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/field';
import { Dialog, DialogFooter } from '@/components/ui/overlays';
import { Skeleton } from '@/components/ui/primitives';
import * as account from '@/lib/api/account';
import { errorMessage } from '@/lib/api/errors';
import { API_URL } from '@/lib/api/http';
import { timeAgo } from '@/lib/format';
import { useAccountMutation, useCaptureToken } from '@/lib/queries';
import { gmailCaptureScript } from './gmail-script';
import { Section } from './settings-views';

// Where the Gmail script sends emails: this app's /api/v1, which forwards to the API.
function ingestEndpoint(): string {
  return new URL(`${API_URL}/inbound/gmail`, window.location.origin).href;
}

const STEPS = [
  <>
    Open{' '}
    <a href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer">
      script.google.com
    </a>{' '}
    (signed in to the Gmail you apply from). A new project opens.
  </>,
  'Delete the sample code, paste the script, and press Save (Ctrl+S).',
  <>
    In the toolbar, pick <code>setup</code> from the function list and press <b>Run</b>.
  </>,
  <>
    Google asks for access. Because this is your own script it says &ldquo;Google hasn&rsquo;t
    verified this app&rdquo;: choose <b>Advanced → Go to project (unsafe)</b> → <b>Allow</b>.
  </>,
  'Done. It checks every 5 minutes; the first run looks back 30 days.',
];

export function CaptureSettings() {
  const status = useCaptureToken();
  const create = useAccountMutation(account.createCaptureToken);
  const revoke = useAccountMutation(account.revokeCaptureToken);
  const [script, setScript] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const generate = async () => {
    setConfirmReplace(false);
    try {
      const { token } = await create.mutateAsync(undefined);
      setScript(gmailCaptureScript({ endpoint: ingestEndpoint(), token }));
      setCopied(false);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const copy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      toast.success('Script copied. Paste it into script.google.com.');
    } catch {
      toast.error('Copy failed: select the text and copy it by hand.');
    }
  };

  const active = status.data?.active === true;

  return (
    <>
      <Section
        title="Gmail capture"
        description="Applications you make on LinkedIn and Indeed show up here on their own, with a reminder to follow up a week later."
      >
        {!status.data ? (
          <Skeleton className="h-16" />
        ) : (
          <div className="flex items-start gap-3 border border-line px-4 py-3">
            <MailCheck
              size={18}
              aria-hidden="true"
              className={active ? 'text-accent-text' : 'text-muted'}
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold">{active ? 'Connected' : 'Not connected'}</span>
              <span className="text-sm text-muted">
                {!active
                  ? 'Create a script below and install it in your Gmail.'
                  : status.data.lastUsedAt
                    ? `Last sync ${timeAgo(status.data.lastUsedAt)}`
                    : 'Waiting for the first sync from your Gmail.'}
              </span>
            </div>
          </div>
        )}

        {script ? (
          <div className="flex flex-col gap-3">
            <p className="m-0 text-sm font-semibold">
              Copy it now: the token inside is shown only once.
            </p>
            <Textarea
              readOnly
              value={script}
              rows={10}
              aria-label="Gmail capture script"
              className="font-mono text-xs"
              onFocus={(e) => {
                e.currentTarget.select();
              }}
            />
            <div>
              <Button
                variant="primary"
                onClick={() => {
                  void copy();
                }}
              >
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Copy size={15} aria-hidden="true" />
                )}
                {copied ? 'Copied' : 'Copy script'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              loading={create.isPending}
              onClick={() => {
                if (active) setConfirmReplace(true);
                else void generate();
              }}
            >
              {active ? 'Create a new script…' : 'Create my script'}
            </Button>
            {active && (
              <Button
                variant="danger"
                loading={revoke.isPending}
                onClick={() => {
                  revoke.mutateAsync(undefined).then(
                    () => toast.success('Disconnected. The script in your Gmail stops working.'),
                    (err: unknown) => toast.error(errorMessage(err)),
                  );
                }}
              >
                Disconnect
              </Button>
            )}
          </div>
        )}
      </Section>

      <Section
        title="Install it"
        description="Five minutes, once. Nothing to install on your computer."
      >
        <ol className="m-0 grid list-decimal gap-3 pl-5 text-sm">
          {STEPS.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Section>

      <Section
        title="What it reads"
        description="Only job emails, matched by a Gmail search inside the script. Nothing else leaves your inbox."
      >
        <ul className="m-0 grid list-disc gap-2 pl-5 text-sm">
          <li>
            <b>Tracked now:</b> LinkedIn Easy Apply and Indeed Apply confirmations.
          </li>
          <li>
            <b>Saved for upcoming rules:</b> Rozee.pk, Mustakbil, hiring-tool emails, HR replies and
            CVs you send. Kept 30 days, so they&rsquo;re picked up once those rules ship.
          </li>
          <li>Already-tracked applications are never duplicated.</li>
          <li>Captured emails are labelled &ldquo;Mission Control&rdquo; in Gmail.</li>
        </ul>
      </Section>

      <Dialog
        open={confirmReplace}
        onOpenChange={setConfirmReplace}
        title="Create a new script?"
        description="The script already in your Gmail stops working. Paste the new one in its place."
      >
        <DialogFooter>
          <Button
            onClick={() => {
              setConfirmReplace(false);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={create.isPending}
            onClick={() => {
              void generate();
            }}
          >
            Create new script
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
