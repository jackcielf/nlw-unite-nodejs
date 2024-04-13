import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function registerForEvent(app: FastifyInstance) {
	app
    .withTypeProvider<ZodTypeProvider>()
    .post("/events/:eventId/attendees", {
			schema: {
				body: z.object({
					name: z.string().min(4),
					email: z.string().email(),
				}),
				params: z.object({
					eventId: z.string().uuid(),
				}),
				response: {
					201: z.object({
						attendeeId: z.number(),
					}),
				},
			},
		}, async (request, reply) => {
      const { eventId } = request.params;
      const { name, email } = request.body;

      const attendeeFromEmail = await prisma.attendee.findUnique({
        where: {
          eventId_email: {
            email,
            eventId
          }
        }
      });

      if (attendeeFromEmail !== null) {
        throw new Error('Email já está registrado neste evento');
      }

      // Executa duas queries em tabelas diferentes ao mesmo tempo
      const [event, amoutOfAttendeesForEvent] = await Promise.all([
        prisma.event.findUnique({
          where: {
            id: eventId
          }
        }),
        prisma.attendee.count({
          where: {
            eventId
          }
        })
      ]);

      if (event?.maximunAttendees && amoutOfAttendeesForEvent >= event?.maximunAttendees) {
        throw new Error("O evento já alcançou o máximo de participantes");
      }

      const attendee = await prisma.attendee.create({
        data: {
          name,
          email,
          eventId
        }
      });

      return reply.status(201).send({ attendeeId: attendee.id })
    }
	);
}
