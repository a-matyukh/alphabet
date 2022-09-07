/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
// and what to do when importing types
declare namespace App {
	// interface Locals {}
	// interface PageData {}
	// interface Platform {}
}

type Hands = "✋ both 🤚" | "✋ left" | "right 🤚"
interface ICard {
    letter: string
    hand: Hands
    coords: [number, number]
}