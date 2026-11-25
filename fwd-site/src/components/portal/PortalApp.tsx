import { useEffect, useState, type FormEvent } from 'react';
import { api, errorText, type PortalUser } from './api';
import { Button, Card, Field, Notice, Pill, inputClass, useAction } from './ui';
import { stageLabel } from '../../data/portal';
import AdminHome from './AdminHome';
import AdminProject from './AdminProject';
import ClientProject from './ClientProject';

const readHash = () => window.location.hash.replace(/^#/, '') || '/';

export default function PortalApp() {
  // undefined = still checking, null = signed out
  const [user, setUser] = useState<PortalUser | null | undefined>(undefined);
  const [route, setRoute] = useState(readHash);
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    const onHash = () => {
      // A sign-in link opened in a tab that already has this page loaded only
      // changes the hash, so reload to run the sign-in step below.
      if (readHash().startsWith('/signin/')) window.location.reload();
      else setRoute(readHash());
    };
    const onSignedOut = () => setUser(null);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('portal:signed-out', onSignedOut);

    const signin = readHash().match(/^\/signin\/([A-Za-z0-9_-]+)$/);
    if (signin) {
      // Take the one-time token out of the address bar straight away.
      window.history.replaceState(null, '', '/portal#/');
      setRoute('/');
      api<{ user: PortalUser }>('/verify', { method: 'POST', body: { token: signin[1] } })
        .then((data) => setUser(data.user))
        .catch(async (err) => {
          // An already-used link is fine if this browser is still signed in.
          const me = await api<{ user: PortalUser | null }>('/me').catch(() => ({ user: null }));
          setUser(me.user);
          if (!me.user) setLinkError(errorText(err));
        });
    } else {
      api<{ user: PortalUser | null }>('/me')
        .then((data) => setUser(data.user))
        .catch(() => setUser(null));
    }
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('portal:signed-out', onSignedOut);
    };
  }, []);

  const signOut = async () => {
    await api('/logout', { method: 'POST', body: {} }).catch(() => {});
    window.location.hash = '#/';
    setUser(null);
  };

  if (user === undefined) return <p className="py-20 text-center text-slate-600">Loading...</p>;
  if (user === null) return <SignIn initialError={linkError} />;

  const projectId = route.match(/^\/p\/([0-9a-f-]{36})$/)?.[1];
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
        <span>
          Signed in as <strong className="text-slate-900">{user.email}</strong>
        </span>
        <Button variant="link" onClick={signOut}>Sign out</Button>
      </div>
      {user.role === 'admin' ? (
        projectId ? <AdminProject key={projectId} id={projectId} /> : <AdminHome />
      ) : projectId ? (
        <ClientProject key={projectId} id={projectId} />
      ) : (
        <ClientHome />
      )}
    </div>
  );
}

function SignIn({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');
  const { busy, error, run } = useAction();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      const data = await api<{ devLink?: string }>('/login', { method: 'POST', body: { email } });
      setDevLink(data.devLink || '');
      setSent(true);
    });
  };

  return (
    <div className="mx-auto max-w-md py-8">
      <Card title="Client area">
        {sent ? (
          <div className="space-y-3">
            <Notice tone="success">Check your inbox. If {email} is registered, a sign-in link is on its way.</Notice>
            <p className="text-sm text-slate-600">The link works once and lasts 30 minutes. Nothing after a few minutes? Check your junk folder, or try again.</p>
            {devLink && <a className="block break-all text-sm text-violet-700 underline" href={devLink} data-testid="dev-link">{devLink}</a>}
            <Button variant="secondary" onClick={() => setSent(false)}>Use a different email</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <p className="text-slate-600">Enter your email and I will send you a link to sign in. There is no password to remember.</p>
            {initialError && <Notice tone="error">{initialError}</Notice>}
            <Field label="Email address">
              <input type="email" required autoComplete="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" disabled={busy} className="w-full">{busy ? 'Sending...' : 'Email me a sign-in link'}</Button>
          </form>
        )}
      </Card>
      <p className="mt-4 text-center text-sm text-slate-600">
        Not a client yet? <a className="text-violet-700 underline" href="/contact">Get in touch</a>.
      </p>
    </div>
  );
}

function ClientHome() {
  const [projects, setProjects] = useState<{ id: string; name: string; stage: string }[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ projects: { id: string; name: string; stage: string }[] }>('/projects')
      .then((data) => {
        // Most clients have one project, so take them straight to it.
        if (data.projects.length === 1) window.location.replace(`/portal#/p/${data.projects[0].id}`);
        else setProjects(data.projects);
      })
      .catch((err) => setError(errorText(err)));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!projects) return <p className="py-10 text-center text-slate-600">Loading...</p>;
  if (!projects.length) return <Card title="Nothing here yet"><p className="text-slate-600">Your project has not been set up yet. I will email you when it is ready.</p></Card>;
  return (
    <Card title="Your projects">
      <ul className="divide-y divide-slate-200">
        {projects.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 py-3">
            <a className="font-semibold text-violet-700 underline" href={`#/p/${p.id}`}>{p.name}</a>
            <Pill tone="violet">{stageLabel(p.stage)}</Pill>
          </li>
        ))}
      </ul>
    </Card>
  );
}
