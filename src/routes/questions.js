const { errWrap } = require('../config/basic');
const db = require('../helpers/dbHelper');
const {
  MSG_SUCCESS
} = require('../config/constants');
const c = require('../helpers/cookieHelper');

module.exports = app => {
  // FIXME: cookies for each player out of sync
  // (Maybe update cookie upon each request?)
  app.get('/questions/random', errWrap(async (req, res, next) => {
    // TODO: remove any previous questions from game session
    // await db.removeMyPreviousQuestion(
    //   c.getCurrUser(req.session).username,
    //   c.getGameSessionName(req.session)
    // );
    await db.removeSeenQuestions(c.getGameSessionName(req.session));
    const randomQuestion = await db.getRandomQuestion();
    const gs = await db.addQuestionToGameSession(
      c.getCurrUser(req.session).username,
      randomQuestion,
      c.getGameSessionName(req.session)
    );
    c.updateGameSession(gs, req.session);
    res.send(MSG_SUCCESS);
  }));

  app.post('/questions/answer', errWrap(async (req, res, next) => {
    const { answerIndex } = req.body;
    const gs = await db.answerQuestion(
      c.getCurrUser(req.session).username,
      c.getGameSessionName(req.session),
      answerIndex
    );
    c.updateGameSession(gs, req.session);
    res.send(MSG_SUCCESS);
  }));

  app.post('/questions/new', errWrap(async (req, res, next) => {
    const {
      pass,
      question,
      dateAdded
    } = req.body;
    if (pass !== process.env.ADMIN_AUTH_CODE) {
      res.send({ message: 'Unauthenticated attempt to add question' });
      return;
    }
    const newQ = await db.addQuestion(question, dateAdded);
    res.send({
      ...newQ.toObject(),
      ...MSG_SUCCESS
    });
  }));

  app.get('/questions/answer', errWrap(async (req, res, next) => {
    const gs = await db.getGameSession(c.getGameSessionName(req.session));
    c.updateGameSession(gs, req.session);
    res.send(MSG_SUCCESS);
  }));

  app.post('/questions/answer/seen', errWrap(async (req, res, next) => {
    const {
      gameSessionId,
      questionId
    } = req.body;
    await db.setAnswerSeen(gameSessionId, questionId);
    res.send(MSG_SUCCESS);
  }));
};
