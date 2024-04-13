import fastify from "fastify";
import z from "zod"; // Lib for validations
import { PrismaClient } from "@prisma/client";
import { generateSlug } from "./utils/generate-slug";

const app = fastify();

const prisma = new PrismaClient({
	log: ["query"],
});

// SEMÂNTICA DE ERROS
	// 20x -> Sucesso
	// 30x -> Redirecionamento
	// 40x -> Erro do cliente (Erro em alguma informação enviado por quem está fazendo a chamada para a API)
	// 50x -> Erro do servidor (Um erro que está acontecendo INDEPENDENTE do que está sendo enviado para o servidor)

app.post("/events", async (request, replay) => {
	const createEventSchema = z.object({
		title: z.string().min(4),
		details: z.string().nullable(),
		maximunAttendees: z.number().int().positive().nullable(),
	});

	const data = createEventSchema.parse(request.body);

	const slug = generateSlug(data.title);

	const eventWithSameSlug = await prisma.event.findUnique({
		where: {
			slug
		}
	});

	if (eventWithSameSlug !== null) {
		throw new Error("Slug já existente")
		
	}

	const event = await prisma.event.create({
		data: {
			title: data.title,
			details: data.details,
			maximunAttendees: data.maximunAttendees,
			slug: slug,
		},
	});

	return replay.status(201).send({ eventId: event.id })
});

app.listen({ port: 3333 }).then(() => {
	console.log("Server running...");
});
