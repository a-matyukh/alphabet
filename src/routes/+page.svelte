{#if game.isStart}
    <Card
        card={card.props}
        isCorrectLetter={game.verdict.isCorrectLetter}
        isCorrectHands={game.verdict.isCorrectHands}
    />
{/if}
{#if hands.one}
    <div class="hand-marker" style="top: {hands.coords[0][1]}px; left: {hands.coords[0][0]}px;"></div>
{/if}
{#if hands.second}
    <div class="hand-marker" style="top: {hands.coords[1][1]}px; left: {hands.coords[1][0]}px;"></div>
{/if}
<video bind:this={video} hidden></video>

<footer>
    <span>
        {#if !game.isStart}
            <button on:click={game.start} disabled={game.isStart}>Start game</button>
        {:else}
            <button on:click={game.stop} disabled={!game.isStart}>Stop game</button>
        {/if}
        <em><small>{hands.isModelLoaded ? "" : "Hands detection model loading..."}</small></em>
    </span>
    {#if game.isCheck}
        <span>Right answers: {game.points}</span>
    {/if}
    {#if !game.isStart}
        <details>
            <summary>Settings:</summary>
            <p>New card display interval: <input type="number" min="0" max="9999" bind:value="{game.tick}" disabled={game.isStart}> ms</p>
            <p>Random card position: <input type="checkbox" bind:checked="{game.isHaosCard}"></p>
            <p>Collect right answers: <input type="checkbox" bind:checked="{game.isCheck}"></p>
        </details>
        <span><a href="https://github.com/a-matyukh/alphabet">github</a></span>
    {/if}
</footer>
<style>
:global(body) {
    font-family: Arial, Helvetica, sans-serif;
    margin: 0;
    background-color: #e9e9e9;
}
.hand-marker {
    position: fixed;
    z-index: 9;
    display: inline-block;
    width: 20px;
    height: 20px;
    border-radius: 10px;
    background-color: green;
}
footer {
    position: absolute;
    bottom: 0;
    box-sizing: border-box;
    padding: 10px;
    width: 100%;
    display: flex;
    justify-content: space-between;
}
</style>
<script lang="ts">
import { onMount } from "svelte"
import Card from "$lib/Card.svelte"
import hearsay from "$lib/hearsay.js"

let screen = {
    height: 0,
    width: 0
}
let video: HTMLVideoElement

let card = {
    props: <ICard>{
        letter: "A",
        hand: "✋ both 🤚",
        coords: [0, 0]
    },
    randomize: {
        letter() {
            let letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            card.props.letter = letters.charAt(Math.floor(Math.random() * letters.length))
        },
        hand() {
            let hands = ["✋ both 🤚", "✋ left", "right 🤚"]
            card.props.hand = hands.at(Math.floor(Math.random() * 3)) as Hands
        },
        coords() {
            let top = Math.floor(Math.random() * screen.height)
            let left = Math.floor(Math.random() * screen.width)
            if (top > screen.height - 150) top -= 170
            if (left > screen.width - 120) left -= 140
            card.props.coords = [top, left] as [number, number]
        }
    }
}

let game = {
    isStart: false,
    timerId: <string | number | NodeJS.Timeout | undefined>undefined,
    tick: 3000,
    isHaosCard: true,
    hearedWord: null,
    isCheck: true,
    points: 0,
    verdict: {
        isCorrectLetter: <null | boolean>null,
        isCorrectHands: <null | boolean>null
    },
    init() {
        screen.height = window.innerHeight
        screen.width = window.innerWidth
        card.props.coords = [screen.height/2 - 70, screen.width/2 - 50]
    },
    start() {
        game.isStart = true
        game.points = 0
        game.timerId = setInterval(() => {
            if (game.isCheck) game.check()
            card.randomize.letter()
            card.randomize.hand()
            if (game.isHaosCard) card.randomize.coords()
        }, game.tick)
        if (game.isCheck) recognition.instance.start()
    },
    listen(event) {
        let result = event.results
        let index = result.length - 1
        game.hearedWord = result[index][0].transcript.trim().toLowerCase()
        game.analyze()
    },
    analyze() {
        let letter = card.props.letter.toLowerCase()
        console.log(`Letter: ${letter}, hear: ${game.hearedWord}`)
        if (game.verdict.isCorrectLetter == true) return
        if (game.verdict.isCorrectLetter == null || game.verdict.isCorrectLetter == false) {
            if (game.hearedWord.indexOf(letter) > - 1) {
                game.answer.right()
            } else {
                hearsay[letter]?.includes(game.hearedWord) ? game.answer.right() : game.answer.false()
            }
        }
    },
    answer: {
        right() {
            game.verdict.isCorrectLetter = true
            game.points += 1
        },
        false() {
            game.verdict.isCorrectLetter = false
        }
    },
    check() {
        game.verdict.isCorrectLetter ? game.verdict.isCorrectLetter = null : game.stop()
        game.verdict.isCorrectHands ? game.verdict.isCorrectHands = null : game.stop()
    },
    stop() {
        clearInterval(game.timerId)
        game.isStart = false
        recognition.instance.stop()
    }
}

let recognition = {
    instance: undefined,
    init() {
        const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
        recognition.instance = new SpeechRecognition()
        if (recognition.instance) {
            recognition.instance.lang = 'en-US'
            recognition.instance.continuous = true
            recognition.instance.interimResults = true
            recognition.instance.maxAlternatives = 1
            recognition.instance.onresult = event => game.listen(event)
            recognition.instance.onstop = () => recognition.start()
        }
    }
}

let hands = {
    model: null,
    isModelLoaded: false,
    coords: [[0,0], [0,0]],
    one: false,
    second: false,
    result: "",
    async init() {
        hands.model = await handTrack.load({flipHorizontal: true})
        hands.isModelLoaded = true
        await handTrack.startVideo(video)
        video.width = screen.width
        hands.detect()
    },
    setSide() {
        hands.result = hands.coords[0][0] > screen.width / 2 ? "right 🤚" : "✋ left"
    },
    async detect() {
        let predictions = await hands.model.detect(video)
        if (predictions.length === 2) {
            if (predictions[1].label != "face") {
                hands.one = true
                hands.second = false
                hands.coords[0][0] = predictions[1].bbox[0]
                hands.coords[0][1] = predictions[1].bbox[1]
                hands.setSide()
            }
        } else if (predictions.length === 3) {
            if (predictions[1].label != "face") {
                hands.one = true
                hands.coords[0][0] = predictions[1].bbox[0]
                hands.coords[0][1] = predictions[1].bbox[1]
            }
            if (predictions[2].label != "face") {
                hands.second = true
                hands.coords[1][0] = predictions[2].bbox[0]
                hands.coords[1][1] = predictions[2].bbox[1]
            }
            hands.result = "✋ both 🤚"
        } else {
            hands.one = false
            hands.second = false
        }
        game.verdict.isCorrectHands = card.props.hand === hands.result ? true : false
        requestAnimationFrame(hands.detect)
    }
}

onMount(async () => {
    game.init()
    recognition.init()
    hands.init()
})

</script>