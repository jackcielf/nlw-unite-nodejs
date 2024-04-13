import fastify, { FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";
import { generateSlug } from "../utils/generate-slug";

export async function createEvent(app: FastifyInstance) {
	app
    .withTypeProvider<ZodTypeProvider>()
    .post("/events",
		{
			schema: {
				body: z.object({
					title: z.string().min(4),
					details: z.string().nullable(),
					maximunAttendees: z.number().int().positive().nullable(),
				}),
				response: {
					201: z.object({
						eventId: z.string().uuid(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { title, details, maximunAttendees } = request.body;

			const slug = generateSlug(title);
			console.log(slug);

			const eventWithSameSlug = await prisma.event.findUnique({
				where: {
					slug,
				},
			});

			if (eventWithSameSlug !== null) {
				throw new Error("Slug já existente");
			}

			const event = await prisma.event.create({
				data: {
					title,
					details,
					maximunAttendees,
					slug,
				},
			});

			return reply.status(201).send({ eventId: event.id });
		}
	);
}
