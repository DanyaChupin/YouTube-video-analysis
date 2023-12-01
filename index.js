'use strict'
const sentiment = require('sentiment')
// Sentiment - библиотека для анализа строки на позитивность/негативность.

const { removeStopwords } = require('stopword')
// StopWord - библиотека для удаления слов не несущих смысловой нагрузки.

const Sentimentobj = new sentiment()

const API = 'AIzaSyA7qLolVChwDIUyrdiMJ5WpEvFgEi5Tp8s'
// API - необходим для доступа к комментариям видео по его id.

const idVideo = ['LECMQXjaua0']
// idVideo - массив с id нужного для анализа видео.

const videoAnalysis = []
// VideoAnalisysis - изначальное состояние.

const analysisOfComment = (comment, numVideo) => {
	const commentAuthor =
		comment.snippet.topLevelComment.snippet.authorDisplayName

	const currentComment =
		comment.snippet.topLevelComment.snippet.textOriginal.split(' ')

	const commentFiltering = removeStopwords(currentComment)
		.join(' ')
		.replace(/[^\w\s]/g, '')
		.replace(/[0-9.,:]/, '')
	// Фильтруем комментарий от смайлов, цифр и от слов не несущих смысловой нагрузки.

	const analysisToken = Sentimentobj.analyze(commentFiltering)
	// Анализируем отфильтрованный комментарий

	if (analysisToken.score > 0) {
		videoAnalysis[numVideo].positive.push({
			user: commentAuthor,
			originComment: currentComment.join(' '), // Cюда добавляется оригинал комментария.
			filteredComment: commentFiltering, // Сюда добавляем отфильтрованный комментарий для сравнений с оригиналом.
		})
	} else if (analysisToken.score < 0) {
		videoAnalysis[numVideo].negative.push({
			user: commentAuthor,
			originComment: currentComment.join(' '), // Cюда добавляется оригинал комментария.
			filteredComment: commentFiltering, // Сюда добавляем отфильтрованный комментарий для сравнений с оригиналом.
		})
	} else {
		videoAnalysis[numVideo].neutral.push({
			user: commentAuthor,
			originComment: currentComment.join(' '), // Cюда добавляется оригинал комментария.
			filteredComment: commentFiltering, // Сюда добавляем отфильтрованный комментарий для сравнений с оригиналом.
		})
	}
}

const results = async function getComents() {
	for (let i = 0; i < idVideo.length; i++) {
		const response = await fetch(
			`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&key=${API}&videoId=${idVideo[i]}&maxResults=200`
		)
		if (response.ok) {
			const data = await response.json()
			videoAnalysis.push({
				id: idVideo[i], // id видео
				numberOfComments: data.pageInfo.totalResults, // общее количество комментариев.
				statisticsState: [],
				positive: [],
				neutral: [],
				negative: [],
			})
			data.items.map(comment => analysisOfComment(comment, i)) // передаем комментарий под анализ.
		} else {
			throw new Error('error', response.status)
		}
	}

	for (let i = 0; i < videoAnalysis.length; i++) {
		videoAnalysis[i].statisticsState.push({
			positive: videoAnalysis[i].positive.length,
			negative: videoAnalysis[i].negative.length,
			neutral: videoAnalysis[i].neutral.length,
		})
	} // Подводим общий итог количества позитивных, нейтральтных и негативных комментариев.

	videoAnalysis.map(video => console.log(video))
}

results()
