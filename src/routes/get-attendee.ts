import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function getAttendee(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .get("/attendees/:attendeeId", {
      schema: {
        params: z.object({
          attendeeId: z.string().transform(Number), //  OU  z.coerce.number().int(),
        }),
        response: {}
      }
    }, async (request, reply) => {
      const { attendeeId } = request.params;

      const attendee = await prisma.attendee.findUnique({
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          event: {
            select: {
              title: true
            }
          }
        },
        where: {
          id: attendeeId
        }
      });

      if (attendee === null) {
        throw new Error("Participante não encontrado");
      }

      return reply.send({
        id: attendee.id,
        name: attendee.name,
        email: attendee.email,
        createdAt: attendee.createdAt,
        event: attendee.event.title,
      })
    });
}