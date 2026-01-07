// submits a form's data asynchronously as a JSON blob,
// deriving all values from the form itself
// you can wrap this in another function to deal with return data and perform
// context-specific actions
import type { ZodError } from 'zod';

const nc = (s: any) => {
	return s ? s : '';
};

const handleSubmitJson = async (e: Event): Promise<Response> => {
	if (!(e.target instanceof HTMLFormElement)) throw new Error('Not called on HTMLFormElement');

	e.target.querySelector('button[type="submit"]')?.setAttribute('disabled', 'disabled');

	const res = await fetch(e.target.action, {
		headers: new Headers({ 'Content-Type': 'application/json' }),
		method: e.target.method,
		body: JSON.stringify(objectFromForm(e.target)),
	});

	e.target.querySelector('button[type="submit"]')?.removeAttribute('disabled');

	let redir = res.headers.get('Location');
	if (redir) {
		// TODO: handle redirects?
		console.log(`Redirect to ${redir}`);
	}

	return res;
};

const objectFromForm = (f: HTMLFormElement) => {
	// convert FormData to an object, then a list of entries, filter the empty entries,
	// then convert the result back to an object - this is wonky but should make both Rust and zod
	// validate things more easily
	return Object.fromEntries(
		Object.entries(Object.fromEntries(new FormData(f))).filter(([_, v]) => v !== ''),
	);
};

const resetZodErrors = (f: HTMLFormElement) => {
	const errorClass = 'red-500';
	// find every element with the class and remove it to reset the state
	f.querySelectorAll(`.text-${errorClass}`).forEach((el) =>
		el.classList.remove(`text-${errorClass}`),
	);

	f.querySelectorAll(`.border-${errorClass}`).forEach((el) =>
		el.classList.remove(`border-${errorClass}`),
	);
};

const highlightZodErrors = (f: HTMLFormElement, e: ZodError) => {
	const errorClass = 'red-500';
	// add the class to every element that has an error
	e.errors.forEach((err) => {
		const label = f.querySelector(`[for="${err.path[0]}"]`);
		label?.classList.add(`text-${errorClass}`);

		const input = f.querySelector(`[name="${err.path[0]}"]`);
		input?.classList.add(`border-${errorClass}`);
	});
};

// parses out the value of a single entry in a string of cookies
// returns undefined if the named value does not exist
const cookieValue = (s: string): string | undefined => {
	const val = document.cookie
		.split('; ')
		.find((row) => row.startsWith(`${s}=`))
		?.split('=')[1];
	if (!val) return;

	return decodeURIComponent(val);
};

export { cookieValue, handleSubmitJson, highlightZodErrors, nc, objectFromForm, resetZodErrors };
