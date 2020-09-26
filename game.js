const { red, bold, greenBright, yellowBright } = require('cli-color')
const { radar } = require('chalk-animation')
const readline = require('readline')
const minimist = require('minimist')
const argv = minimist(process.argv.splice(2))
const fs = require('fs')

// TODO: add game numbers

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Log file creation and game results recording
let logFile = argv._[0]

const writeDownResults = data =>
  new Promise(async (resolve, reject) => {
    fs.appendFile('./logFile.txt', data, 'utf8', err => {
      try {
        if (err) {
          console.error(err)
          process.exit(1)
        }

        resolve (data)
      }
      catch (err) {
        reject(err)
        console.error(err)
        process.exit(1)
      }
    })
  })

if (!logFile) logFile = './logFile.txt'

// Game logic implementation
const game = async () => {

  const chooseRandomCard = hand => {
    const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
    const randomInt = getRandomInt(0, cardDeck.length - 1)
    const randomCard = cardDeck[randomInt]

    cardDeck.splice(randomInt, 1)

    return randomCard
  }

  const dealCards = async hand => {
    const randomCard = chooseRandomCard(hand)
    hand.push(randomCard)
  }

  const getSum = hand =>
    new Promise((resolve, reject) => {
      try {
        let sum = 0

        for (const card of hand) {
          // ! Check for fix logic by removing 2nd 'for ... of' and adding 'else if ...' block
          if (card !== 'A') {
            if (card === 'J' || card === 'Q' || card === 'K') {
              sum += 10
            } else {
              sum += +card
            }
          }
        }

        for (const card of hand) {
          if (card === 'A') {
            if (sum > 10) {
              sum += 1
            } else {
              sum += 11
            }
          }
        }

        resolve(sum)
      }
      catch (err) {
        reject(err)
        console.error(err)
        process.exit(1)
      }
    })

  const getStatus = (player, dealer) => {
    `Player: ${player.join(', ')}.\nDealer: ${dealer[0].toString()}.`
  }

  const askQuestion = (player, dealer) =>
    new Promise(reject => {
      try {
        rl.question(`${getStatus(player, dealer)}\nOne more card? 1 - Yes, Otherwise - No.\n`, async response => {
          let sumPlayer = await getSum(player)
          let sumDealer = await getSum(dealer)

          if (response === '1') {
            await dealCards(player)
            sumPlayer = await getSum(player)
            await checkSum(sumPlayer, sumDealer, response)
          } else {
            // ! Check the loop here
            while (sumDealer < 17) {
              await dealCards(dealer)
              sumDealer = await getSum(dealer)
            }

            await checkSum(sumPlayer, sumDealer, response)
          }
        })
      }
      catch(err) {
        reject(err)
        console.error(err)
        process.exit(1)
      }
    })

  const checkSum = (sumPlayer, sumDealer, response) =>
    new Promise (async (resolve, reject) => {
      try {

        // ! few decks!
        // ! > 21 - Lose
        // 
        if (sumPlayer === 21 && response === '1') {
          resolve(console.log(greenBright(bold(`Incredible! You won!\n ${getStatus(player, dealer)}`))))
          await writeDownResults('Victory\n')
          process.exit(0)

        } else if (sumPlayer > 21) {
          resolve(console.log(red(bold(`Too much! You lose!\n ${getStatus(player, dealer)}`))))
          await writeDownResults('Defeat\n')
          process.exit(0)
        }

        if (sumDealer === 21) {
          resolve(console.log(red(bold(`Luck is on the side of the casino this time! You lose!\n ${getStatus(player, dealer)}`))))
          await writeDownResults('Defeat\n')
          process.exit(0)

        } else if (sumDealer > 21) {
          resolve(console.log(greenBright(bold(`Dealer got too much! You won!\n${getStatus(player, dealer)}`))))
          await writeDownResults('Victory\n')
          process.exit(0)

        } else if (sumDealer === sumPlayer) {
          resolve(console.log(yellowBright(bold(`Ничья!\n ${getStatus(player, dealer)}`))))
          await writeDownResults('Draw\n')
          process.exit(0)

        } else if ((sumDealer < sumPlayer) && response !== '1') {
          resolve(console.log(greenBright(bold(`You won!\n ${getStatus(player, dealer)}`))))
          await writeDownResults('Victory\n')
          process.exit(0)
        }

        await askQuestion(player, dealer)
      }
      catch (err) {
        reject(err)
        console.error(err)
        process.exit(1)
      }
    })

  // Card deck
  const cardDeck = [
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',   // ♤ 
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',   // ♡
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A',   // ♢
    '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'    // ♧
  ]

  // Dealer's cards and player's cards respectively
  const dealer = []
  const player = []

  // Deal of cards to participants at the beginning of the game
  await dealCards(dealer)
  await dealCards(dealer)
  await dealCards(player)
  await dealCards(player)

  // Immediately check for the player Blackjack when dealt
  const checkOnDealBlackjack = new Promise(async (resolve, reject) => {
    try {
      const sumPlayer = await getSum(player)
      resolve(sumPlayer)
    }
    catch(err) {
      reject(err)
      console.error(err)
      process.exit(1)
    }
  })

  checkOnDealBlackjack.then(async sumPlayer => {
    try {
      if (sumPlayer === 21) {
        console.log(greenBright(bold.italic.underline(`Deal Blackjack! You won! ${getStatus(player, dealer)}`)))
        radar('-------------------------', 1)
        await writeDownResults('Victory\n')
        // ! process.exit(0)
        setTimeout(() => process.exit(0), 3200)
      }
    } catch(err) {
      console.error(err)
      process.exit(1)
    }
  })

  // The player is asked whether one more card is needed
  await askQuestion(player, dealer)

}

game()
