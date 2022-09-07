<div style="top: {card.coords[0]}px; left: {card.coords[1]}px">
    <h1 class:right={isCorrectLetter == true}>{card.letter}</h1>
    <h3 class:right={isCorrectHands == true}>{card.hand}</h3>
</div>

<style>
div {
    position: fixed;
    display: flex;
    flex-direction: column;
    width: 120px;
    height: 130px;
    box-sizing: border-box;
    padding: 10px 5px;
    text-align: center;
    border-radius: 10px;
    background-color: #fff;
}
h1, h3 {
    margin: 0;
    padding: 10px;
}
.right {
    color: green;
}
</style>
<script lang="ts">
export let card: ICard, isCorrectLetter, isCorrectHands
</script>