type SmokeReport = {
	ok: boolean;
	url: string;
	checks: Record<string, boolean>;
	contactOptions: string[];
	error?: string;
};

const targetUrl = Bun.argv[2] ?? 'https://kakyu.dev/colabo';

if (!/^https?:\/\//.test(targetUrl)) {
	throw new Error(`Expected an http(s) URL, received: ${targetUrl}`);
}

// Run the blocking native Cocoa event loop in a child process so a failed page
// load can never leave this smoke command hanging indefinitely.
if (process.env.COLABO_WEBVIEW_CHILD !== '1') {
	const child = Bun.spawn([process.execPath, import.meta.path, targetUrl], {
		cwd: import.meta.dir,
		env: { ...process.env, COLABO_WEBVIEW_CHILD: '1' },
		stdin: 'ignore',
		stdout: 'inherit',
		stderr: 'inherit',
		timeout: 25_000,
		killSignal: 'SIGTERM'
	});
	const exitCode = await child.exited;
	if (child.signalCode === 'SIGTERM') console.error('Bun WebView smoke timed out after 25 seconds.');
	process.exit(exitCode);
}

const { SizeHint, Webview } = await import('webview-bun');

const webview = new Webview(false, {
	width: 1180,
	height: 820,
	hint: SizeHint.NONE
});

webview.title = 'Colabo · Bun WebView smoke';
webview.bindRaw('__reportColaboSmoke', (sequence, request) => {
	const [report] = JSON.parse(request) as [SmokeReport];
	webview.return(sequence, 0, JSON.stringify(report.ok));
	console.log(JSON.stringify(report, null, 2));
	process.exit(report.ok ? 0 : 1);
});

webview.bind('__logColaboSmoke', (message: string) => {
	console.error(`[WebView] ${message}`);
});

webview.init(`
(() => {
  const delay = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
	let settled = false;
	const report = async (result) => {
		if (settled) return;
		settled = true;
		await window.__reportColaboSmoke(result);
	};
  const waitFor = async (read, timeout = 6000) => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const value = read();
      if (value) return value;
      await delay(80);
    }
    throw new Error('Timed out while waiting for the Colabo interface');
  };

	void window.__logColaboSmoke('injected QA script initialized');
	setTimeout(() => {
		void report({
			ok: false,
			url: location.href,
			checks: {},
			contactOptions: [],
			error: 'Timed out while waiting for the page lifecycle'
		});
	}, 15000);

	const inspect = async () => {
    const checks = {};
    let contactOptions = [];

    try {
      await delay(500);
      const heading = document.querySelector('h1');
      const identity = await waitFor(() => document.querySelector('.identity-field input:not([type="hidden"])'));
      const message = document.querySelector('textarea[name="message"]');
      const send = document.querySelector('button.send');
			const form = document.querySelector('form.composer');
			let submissionAttempted = false;
			form?.addEventListener('submit', (event) => {
				submissionAttempted = true;
				event.preventDefault();
			}, { capture: true });

      checks.heading = heading?.textContent?.trim() === 'Collaborations & Contact';
			checks.composer = Boolean(identity && message && send && form);

      identity.value = 'WebView smoke / Kakyu';
      identity.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      const company = await waitFor(() => document.querySelector('.company-field input'));
      checks.slashCompany = company.value === 'Kakyu';

      message.value = 'Local UI smoke only — this draft is never submitted.';
      message.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
      send.click();

      const dialog = await waitFor(() => document.querySelector('dialog[open]'));
      checks.channelSheet = dialog.querySelector('#contact-sheet-title')?.textContent?.trim() === 'Choose the route';
      checks.channels = ['Private note', 'WhatsApp', 'Email', 'Live chat'].every((label) =>
        dialog.textContent?.includes(label)
      );

      const privateButton = [...dialog.querySelectorAll('button.channel')].find((button) =>
        button.textContent?.includes('Private note')
      );
      privateButton?.click();
      await waitFor(() => dialog.querySelector('.contact-options'));
      contactOptions = [...dialog.querySelectorAll('.contact-option span')].map((option) => option.textContent?.trim());
      checks.privateOptions = contactOptions.length === 8 && contactOptions.includes('No contact');
			checks.noSubmission = !submissionAttempted;

      const ok = Object.values(checks).every(Boolean);
			await report({ ok, url: location.href, checks, contactOptions });
    } catch (error) {
			await report({
        ok: false,
        url: location.href,
        checks,
        contactOptions,
        error: error instanceof Error ? error.message : String(error)
      });
    }
	};

	if (document.readyState === 'complete') void inspect();
	else window.addEventListener('load', () => void inspect(), { once: true });
})();
`);

webview.navigate(targetUrl);
webview.run();
