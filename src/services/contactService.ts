import { Contact, Prisma, PrismaClient } from '@prisma/client';

export type LinkPrecedence = 'primary' | 'secondary';

export interface IdentifyRequest {
  email: string | null;
  phoneNumber: string | null;
}

export interface IdentifyResponseContact {
  primaryContactId: number;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: number[];
}

export interface IdentifyResponse {
  contact: IdentifyResponseContact;
}

export class ContactService {
  constructor(private readonly prisma: PrismaClient) {}

  async identifyContact(payload: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = payload;

    if (!email && !phoneNumber) {
      throw new Error('At least one of email or phoneNumber must be provided.');
    }

    return this.prisma.$transaction(async (tx) => {
      const existingContacts = await tx.contact.findMany({
        where: {
          deletedAt: null,
          OR: [
            ...(email ? [{ email }] : []),
            ...(phoneNumber ? [{ phoneNumber }] : []),
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (existingContacts.length === 0) {
        const primary = await tx.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: 'primary',
          },
        });

        const contactResponse: IdentifyResponseContact = {
          primaryContactId: primary.id,
          emails: primary.email ? [primary.email] : [],
          phoneNumbers: primary.phoneNumber ? [primary.phoneNumber] : [],
          secondaryContactIds: [],
        };

        return { contact: contactResponse };
      }

      const relatedContacts = await this.getRelatedContacts(tx, existingContacts);

      const primaryContacts = relatedContacts.filter(
        (c) => c.linkPrecedence === 'primary',
      );

      let finalPrimary: Contact;

      if (primaryContacts.length === 0) {
        finalPrimary = relatedContacts.reduce((oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest,
        );
      } else {
        finalPrimary = primaryContacts.reduce((oldest, current) =>
          current.createdAt < oldest.createdAt ? current : oldest,
        );
      }

      const flattenedContacts: Contact[] = [];
      for (const contact of relatedContacts) {
        if (contact.id === finalPrimary.id) {
          if (
            contact.linkPrecedence !== 'primary' ||
            contact.linkedId !== null
          ) {
            const updated = await tx.contact.update({
              where: { id: contact.id },
              data: {
                linkPrecedence: 'primary',
                linkedId: null,
              },
            });
            flattenedContacts.push(updated);
          } else {
            flattenedContacts.push(contact);
          }
        } else {
          if (
            contact.linkPrecedence !== 'secondary' ||
            contact.linkedId !== finalPrimary.id
          ) {
            const updated = await tx.contact.update({
              where: { id: contact.id },
              data: {
                linkPrecedence: 'secondary',
                linkedId: finalPrimary.id,
              },
            });
            flattenedContacts.push(updated);
          } else {
            flattenedContacts.push(contact);
          }
        }
      }

      const exactMatchExists = flattenedContacts.some(
        (c) =>
          c.email === email &&
          c.phoneNumber === phoneNumber,
      );

      let newContact: Contact | null = null;

      if (!exactMatchExists) {
        newContact = await tx.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: 'secondary',
            linkedId: finalPrimary.id,
          },
        });
      }

      const allContacts = await tx.contact.findMany({
        where: {
          deletedAt: null,
          OR: [
            { id: finalPrimary.id },
            { linkedId: finalPrimary.id },
          ],
        },
        orderBy: { createdAt: 'asc' },
      });

      if (newContact) {
        allContacts.push(newContact);
      }

      const emails: string[] = [];
      const emailSet = new Set<string>();

      if (finalPrimary.email) {
        emails.push(finalPrimary.email);
        emailSet.add(finalPrimary.email);
      }

      for (const contact of allContacts) {
        if (contact.id === finalPrimary.id) continue;
        if (contact.email && !emailSet.has(contact.email)) {
          emails.push(contact.email);
          emailSet.add(contact.email);
        }
      }

      const phoneNumbers: string[] = [];
      const phoneSet = new Set<string>();

      if (finalPrimary.phoneNumber) {
        phoneNumbers.push(finalPrimary.phoneNumber);
        phoneSet.add(finalPrimary.phoneNumber);
      }

      for (const contact of allContacts) {
        if (contact.id === finalPrimary.id) continue;
        if (contact.phoneNumber && !phoneSet.has(contact.phoneNumber)) {
          phoneNumbers.push(contact.phoneNumber);
          phoneSet.add(contact.phoneNumber);
        }
      }

      const secondaryContactIds = allContacts
        .filter((c) => c.id !== finalPrimary.id)
        .map((c) => c.id)
        .sort((a, b) => a - b);

      const response: IdentifyResponseContact = {
        primaryContactId: finalPrimary.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
      };

      return { contact: response };
    });
  }

  private async getRelatedContacts(
    tx: Prisma.TransactionClient,
    startingContacts: Contact[],
  ): Promise<Contact[]> {
    const visited = new Map<number, Contact>();
    const queue: Contact[] = [...startingContacts];

    while (queue.length > 0) {
      const current = queue.shift() as Contact;
      if (visited.has(current.id)) {
        continue;
      }

      visited.set(current.id, current);

      const secondaries = await tx.contact.findMany({
        where: {
          deletedAt: null,
          linkedId: current.id,
        },
        orderBy: { createdAt: 'asc' },
      });

      for (const sec of secondaries) {
        if (!visited.has(sec.id)) {
          queue.push(sec);
        }
      }

      if (current.linkedId) {
        const parent = await tx.contact.findUnique({
          where: {
            id: current.linkedId,
          },
        });

        if (parent && !visited.has(parent.id)) {
          queue.push(parent);
        }
      }
    }

    return Array.from(visited.values()).sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}

