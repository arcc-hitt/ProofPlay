// Description: Request validation middleware that uses the `celebrate` library to validate incoming requests against defined schemas.
import { celebrate, Joi, Segments } from 'celebrate';

export const signupValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
});

export const loginValidator = celebrate({
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
});

export const progressValidator = celebrate({
  [Segments.BODY]: Joi.object({
    videoId: Joi.string().required(),
    videoDuration: Joi.number().positive().required(),
    lastPosition: Joi.number().min(0).required(),
    watchedIntervals: Joi.array().items(
      Joi.object({
        start: Joi.number().min(0).required(),
        end: Joi.number().min(Joi.ref('start')).required(),
      })
    ).required(),
  }),
});
