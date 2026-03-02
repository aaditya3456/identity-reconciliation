import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma/client';
import { ContactService, IdentifyRequest } from '../services/contactService';

const contactService = new ContactService(prisma);

export const identifyController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email = null, phoneNumber = null } = req.body as Partial<IdentifyRequest>;

    const payload: IdentifyRequest = {
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
    };

    if (!payload.email && !payload.phoneNumber) {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Either email or phoneNumber must be provided.',
      });
      return;
    }

    const result = await contactService.identifyContact(payload);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

