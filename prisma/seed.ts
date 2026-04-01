import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Commission plateforme (10%)
const PLATFORM_FEE_BPS = 1000; // basis points: 1000 = 10%

function fee(subtotal: number) {
  return Math.round((subtotal * PLATFORM_FEE_BPS) / 10000);
}

async function main() {
  console.log("🌱 Seeding SOS-BESOIN...");

  // 1) Nettoyage (ordre inverse des dépendances)
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.requestCategory.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.category.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.adminAction.deleteMany();
  await prisma.user.deleteMany();

  // 2) Utilisateurs
  const admin = await prisma.user.create({
    data: {
      clerkId: "clerk_admin_001",
      email: "admin@sos-besoin.test",
      name: "Admin SOS",
      role: Role.ADMIN,
      profile: {
        create: {
          bio: "Gestionnaire de la plateforme SOS-BESOIN.",
          city: "Montréal",
          phone: "514-000-0000",
        },
      },
    },
  });

  const client = await prisma.user.create({
    data: {
      clerkId: "clerk_client_001",
      email: "client@sos-besoin.test",
      name: "Camille Client",
      role: Role.CLIENT,
      profile: {
        create: {
          bio: "Organisateur(trice) d'événements et client régulier.",
          city: "Montréal",
        },
      },
    },
  });

  const provider1 = await prisma.user.create({
    data: {
      clerkId: "clerk_provider_001",
      email: "pro.guitar@sos-besoin.test",
      name: "Alex Guitariste",
      role: Role.PROVIDER,
      profile: {
        create: {
          bio: "Guitariste remplaçant, lecture à vue, styles rock/jazz.",
          city: "Montréal",
          phone: "514-111-1111",
        },
      },
    },
  });

  const provider2 = await prisma.user.create({
    data: {
      clerkId: "clerk_provider_002",
      email: "pro.writer@sos-besoin.test",
      name: "Sam Correctrice",
      role: Role.PROVIDER,
      profile: {
        create: {
          bio: "Correction/révision FR-EN, CV, lettres, documents scolaires.",
          city: "Laval",
          phone: "450-222-2222",
        },
      },
    },
  });

  // 3) Catégories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Musique", slug: "musique" } }),
    prisma.category.create({ data: { name: "Maison", slug: "maison" } }),
    prisma.category.create({ data: { name: "Rédaction", slug: "redaction" } }),
    prisma.category.create({ data: { name: "Tech", slug: "tech" } }),
    prisma.category.create({
      data: { name: "Événementiel", slug: "evenementiel" },
    }),
  ]);

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  // 4) Demandes (ServiceRequest) + catégories (N-N)
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const req1 = await prisma.serviceRequest.create({
    data: {
      clientId: client.id,
      title: "SOS: guitariste remplaçant pour show",
      description:
        "Notre guitariste est malade. Set de 90 minutes, style rock/pop. Matériel sur place.",
      neededAt: inDays(2),
      location: "Montréal (Plateau)",
      categories: {
        create: [{ categoryId: catBySlug["musique"].id }, { categoryId: catBySlug["evenementiel"].id }],
      },
    },
  });

  const req2 = await prisma.serviceRequest.create({
    data: {
      clientId: client.id,
      title: "SOS: correction urgente (10 pages)",
      description:
        "Besoin d'une correction orthographe/grammaire et mise en forme légère. Livraison demain soir.",
      neededAt: inDays(1),
      location: "En ligne",
      categories: {
        create: [{ categoryId: catBySlug["redaction"].id }],
      },
    },
  });

  const req3 = await prisma.serviceRequest.create({
    data: {
      clientId: client.id,
      title: "SOS: dépannage Wi-Fi (routeur + mesh)",
      description:
        "Instabilité Wi-Fi depuis une mise à jour. Besoin diagnostic et configuration stable.",
      neededAt: inDays(3),
      location: "Montréal (Rosemont)",
      categories: {
        create: [{ categoryId: catBySlug["tech"].id }, { categoryId: catBySlug["maison"].id }],
      },
    },
  });

  // 5) Offres (5 offres)
  const offer1 = await prisma.offer.create({
    data: {
      requestId: req1.id,
      providerId: provider1.id,
      price: 25000, // 250.00
      message:
        "Disponible. Je peux arriver 1h avant pour soundcheck. Répertoire rock/pop OK.",
    },
  });

  const offer2 = await prisma.offer.create({
    data: {
      requestId: req1.id,
      providerId: provider2.id,
      price: 18000,
      message:
        "Je ne suis pas guitariste, mais je peux aider à l'organisation backstage si besoin.",
    },
  });

  const offer3 = await prisma.offer.create({
    data: {
      requestId: req2.id,
      providerId: provider2.id,
      price: 9000,
      message:
        "Je peux corriger 10 pages d'ici demain 18h, avec annotations et version finale.",
    },
  });

  const offer4 = await prisma.offer.create({
    data: {
      requestId: req3.id,
      providerId: provider1.id,
      price: 12000,
      message:
        "Je peux passer pour diagnostiquer le réseau (canaux, DNS, mesh) et stabiliser.",
    },
  });

  const offer5 = await prisma.offer.create({
    data: {
      requestId: req3.id,
      providerId: provider2.id,
      price: 11000,
      message:
        "Je peux faire un diagnostic à distance (si accès routeur) + recommandations.",
    },
  });

  // 6) Créer 1 booking + 1 payment (démo)
  // On "accepte" offer1 pour req1
  const subtotal = offer1.price;
  const platformFee = fee(subtotal);
  const total = subtotal + platformFee;

  const booking = await prisma.booking.create({
    data: {
      requestId: req1.id,
      offerId: offer1.id,
      amountSubtotal: subtotal,
      platformFee,
      amountTotal: total,
      status: "CONFIRMED",
      payment: {
        create: {
          status: "SUCCEEDED",
          stripePaymentIntentId: "pi_test_seed_001",
        },
      },
    },
  });

  // Mettre des statuts cohérents côté demande/offres (optionnel mais plus réaliste)
  await prisma.serviceRequest.update({
    where: { id: req1.id },
    data: { status: "FILLED" },
  });

  await prisma.offer.update({
    where: { id: offer1.id },
    data: { status: "ACCEPTED", booking: { connect: { id: booking.id } } },
  });

  await prisma.offer.update({
    where: { id: offer2.id },
    data: { status: "REJECTED" },
  });

  await prisma.adminAction.create({
    data: {
      adminId: admin.id,
      action: "Initial seed executed",
    },
  });

  console.log("✅ Seed terminé avec succès.");
  console.log({
    users: { admin: admin.email, client: client.email },
    requests: [req1.title, req2.title, req3.title],
    offers: [offer1.id, offer2.id, offer3.id, offer4.id, offer5.id].length,
  });
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });