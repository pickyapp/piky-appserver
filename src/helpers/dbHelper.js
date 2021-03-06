const { GameSession, Question } = require('../schemas');

const getGameSession = async (gameSessionName) => {
  const session = await GameSession.findOne({ name: gameSessionName })
    .populate('questions.question');
  return session;
};

const addGameSession = async (gameSessionName) => {
  const dup = await getGameSession(gameSessionName);
  if (dup) {
    return dup;
  }
  const gameSession = await GameSession.create({
    name: gameSessionName,
    isGameSessionFree: true,
    questions: []
  });
  return gameSession;
};

const addUserToGameSession = async (username, gameSessionName) => {
  const gameSession = await GameSession.findOneAndUpdate({
    name: gameSessionName
  }, {
    $push: { users: username }
  }, {
    new: true
  });
  return gameSession;
};

const lockGameSessionAndStartCountdown = async (gameSessionName) => {
  const gameSession = await GameSession.findOneAndUpdate({
    name: gameSessionName
  }, {
    isGameSessionFree: false,
    startCountdownTime: (new Date()).getTime()
  }, {
    new: true
  });
  return gameSession;
};

const addQuestion = async (question, dateAdded) => {
  const {
    questionText,
    options
  } = question;
  const q = await Question.create({
    questionText,
    options,
    dateAdded
  });
  return q;
};

const getQuestionCount = async () => {
  const qCount = await Question.count();
  return qCount;
};

const getRandomQuestion = async () => {
  const qCount = await getQuestionCount();
  const randomIndex = Math.floor(Math.random() * qCount);
  const question = await Question.findOne().skip(randomIndex);
  return question;
};

const getQuestionsFrom = async (dateAdded) => {
  const questions = await Question.find({ dateAdded });
  return questions;
};

const updateRandomQuestionsDate = async (amount, date) => {
  const qCount = (await getQuestionCount()) - amount;
  const questions = await Question.find().skip(Math.floor(Math.random() * qCount)).limit(amount);
  const updatePromises = questions.map(question => {
    return Question.findOneAndUpdate({ _id: question._id }, { dateAdded: date }, { new: true });
  });
  const updatedQuestions = await Promise.all(updatePromises);
  return updatedQuestions;
};

const getQuestionAmountAtDate = (date) => {
  return Question.count({ dateAdded: date });
};

const addQuestionToGameSession = async (answerer, question, gsName) => {
  const gs = await GameSession.findOneAndUpdate({ name: gsName },
    {
      $push: {
        questions: {
          answerer: answerer,
          question: question._id,
          answer: 0
        }
      }
    },
    {
      new: true
    }
  ).populate('questions.question');
  return gs;
};

const answerQuestion = async (answerer, gsName, answerIndex) => {
  const gs = await GameSession.findOneAndUpdate(
    { name: gsName, 'questions.answerer': answerer },
    {
      $set: { 'questions.$.answer': answerIndex,
        'questions.$.isAnswered': true
      }
    }
  );
  return gs;
};

const removeMyPreviousQuestion = async (username, gsName) => {
  await GameSession.update({ name: gsName },
    { $pull:
      {
        questions: {
          answerer: { $ne: username },
          isAnswered: true
        }
      }
    }
  );
};

const removeSeenQuestions = async (gameSessionName) => {
  await GameSession.update({ name: gameSessionName },
    { $pull:
      {
        questions: {
          isSeen: true
        }
      }
    }
  );
};

const setAnswerSeen = async (gameSessionId, qId) => {
  await GameSession.findOneAndUpdate(
    { _id: gameSessionId, 'questions._id': qId },
    {
      $set: { 'questions.$.isSeen': true }
    }
  );
};

module.exports = {
  getGameSession,
  addGameSession,
  addUserToGameSession,
  lockGameSessionAndStartCountdown,
  addQuestion,
  getRandomQuestion,
  addQuestionToGameSession,
  answerQuestion,
  removeMyPreviousQuestion,
  removeSeenQuestions,
  setAnswerSeen,
  getQuestionsFrom,
  updateRandomQuestionsDate,
  getQuestionAmountAtDate
};
