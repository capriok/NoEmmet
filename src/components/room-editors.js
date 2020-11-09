/*eslint react-hooks/exhaustive-deps: "off"*/
/*eslint no-unused-vars: "off"*/
import React, { useState, useEffect } from "react"

import '../styles/room-editors.scss'

import { Input } from 'godspeed'

const randomWords = require('random-words')

const RoomEditors = (props) => {
	const { socket, lobby, User, HostId } = props

	const isHost = User.userId === HostId
	const isPlayer = lobby.players.some(player => player.userId === User.userId)
	let localPlayer = lobby.players.find(p => p.userId === User.userId)
	let foreignPlayer = lobby.players.find(p => p.userId !== User.userId)

	const [acc, setAcc] = useState(0)
	const [wpm, setWPM] = useState(0)
	const [loading, setLoading] = useState(true)
	const [count, setCount] = useState(null)
	const [wordSet, setWordSet] = useState([])
	const [wordInput, setWordInput] = useState('')
	const [currentIndex, setCurrentIndex] = useState(0)
	const [wordClasses, setwordClasses] = useState([])
	const [startTime, setStartTime] = useState(null)
	const [correctKeys, setCorrectKeys] = useState(0)

	useEffect(() => {
		if (!lobby.inSession) {
			if (lobby.playersReady) {
				let wordSet = []
				if (isHost) wordSet = randomWords({ exactly: 25, maxLength: 5 })
				socket.emit('lobby-development', { wordSet })
			}
			socket.on('lobby-words', (wordSet) => setWordSet(wordSet))
			socket.on('lobby-countdown', (count) => setCount(count))
		} else {
			setLoading(false)
			setWordSet(lobby.wordSet)
		}
	}, [])

	useEffect(() => {
		if (wordSet.length > 0) {
			if (lobby.inSession) return
			socket.emit('lobby-start')
		}
	}, [wordSet])

	useEffect(() => {
		if (count === 0) setLoading(false)
	}, [count])

	function inputChange(e) {
		if (currentIndex !== wordSet.length) {
			setWordInput(e.target.value.replace(/[^a-z]/ig, '').toLowerCase())
		}
	}

	function incrementIndex() {
		setCurrentIndex(currentIndex + 1)
		setWordInput('')
	}

	function setCurrentClass(evaluation) {
		setwordClasses([...wordClasses, evaluation])
		evaluation === 'correct' && setCorrectKeys(correctKeys + wordSet[currentIndex].length)
		incrementIndex()
	}

	function checkWord(e) {
		let key = e.key
		let isLastWord = currentIndex === wordSet.length - 1
		let lastWord = wordSet[wordSet.length - 1]
		if (wordInput === '') return
		if (!((key >= 'a' && key <= 'z') || key === ' ')) return
		if (key === ' ') {
			wordInput === wordSet[currentIndex]
				? setCurrentClass('correct')
				: setCurrentClass('incorrect')
		} else if (isLastWord && wordInput.length === lastWord.length - 1) {
			wordInput + key === wordSet[currentIndex]
				? setCurrentClass('correct')
				: setCurrentClass('incorrect')
			incrementIndex()
		}
	}

	function calculate() {
		let totalChars = 0
		let wordsTyped = correctKeys / 5
		let timeTaken = (Date.now() - startTime) / 1000 / 60
		wordSet.forEach(w => totalChars += w.length)
		setAcc(Math.floor((correctKeys / totalChars) * 100))
		setWPM(Math.floor(wordsTyped / timeTaken))
	}

	useEffect(() => {
		wordInput !== '' && currentIndex === 0 && setStartTime(Date.now())
	}, [wordInput])

	useEffect(() => {
		currentIndex === wordSet.length && calculate()
	}, [currentIndex])

	function wordClass(i) {
		return i === currentIndex
			? 'current'
			: wordClasses[i]
	}

	return (
		<div className="editors-main">
			<div className="controls">
				<div className="control-placeholder" />
			</div>
			<div className="editors">
				{/* LOCAL CLIENT */}
				<div className="editor-cont">
					<div className="head">
						<div className="name">
							<p>{isPlayer ? localPlayer.name : lobby.players[0].name}</p>
						</div>
						<div className="stats-cont">
							<span>
								Accuracy: {isPlayer ? localPlayer.accuracy : lobby.players[0].accuracy} |
								WPM: {isPlayer ? localPlayer.wpm : lobby.players[0].wpm}</span>
						</div>
					</div>
					<div className="body">
						<div className="text-area">
							{loading
								? <div className="on-load">
									<div className="time">{count}</div>
									<div className="spinner" />
								</div>
								: wordSet.map((w, i) => (
									<span className={wordClass(i)} key={i}>{w} </span>
								))
							}
						</div>
						{(loading || wordSet.length > 0) && isPlayer &&
							<div className="input-area">
								<Input
									onChange={(e) => inputChange(e)}
									onKeyDown={(e) => checkWord(e)}
									value={wordInput} />
							</div>
						}
					</div>
				</div>
				<br />
				{/* FOREIGN CLIENT */}
				<div className="editor-cont">
					<div className="head">
						<div className="name">
							<p>{isPlayer ? foreignPlayer.name : lobby.players[1].name}</p>
						</div>
						<div className="stats-cont">
							<span>
								Accuracy: {isPlayer ? localPlayer.accuracy : lobby.players[0].accuracy} |
								WPM: {isPlayer ? localPlayer.wpm : lobby.players[0].wpm}</span>
						</div>
					</div>
					<div className="body">
						<div className="text-area">
							{loading
								? <div className="on-load">
									<div className="time">{count}</div>
									<div className="spinner" />
								</div>
								: wordSet.map((w, i) => (
									<span key={i}>{w} </span>
								))
							}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export default RoomEditors