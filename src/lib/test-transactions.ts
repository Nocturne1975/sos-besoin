import { prisma } from "./prisma";
import { acceptOfferAndCreateBooking } from "./transactions";

async function testTransactions() {
  let passed = 0;
  let total = 0;

  console.log("=== TEST 1 : Acceptation réussie ===");
  total++;

  // Trouver une demande OPEN avec une offre PENDING
  const request = await prisma.serviceRequest.findFirst({
    where: { status: "OPEN", booking: null },
    include: { offers: true },
  });

  if (!request) {
    console.log("SKIP: aucune demande OPEN trouvée (seed déjà 'FILLED' partout ?)");
  } else {
    const offer = await prisma.offer.findFirst({
      where: { requestId: request.id, status: "PENDING" },
    });

    if (!offer) {
      console.log("SKIP: aucune offre PENDING trouvée pour la demande.");
    } else {
      const before = await prisma.serviceRequest.findUnique({
        where: { id: request.id },
        include: { booking: true },
      });

      const res = await acceptOfferAndCreateBooking({
        requestId: request.id,
        offerId: offer.id,
      });

      const after = await prisma.serviceRequest.findUnique({
        where: { id: request.id },
        include: { booking: true },
      });

      const booking = after?.booking
        ? await prisma.booking.findUnique({
            where: { requestId: request.id },
            include: { payment: true },
          })
        : null;

      const ok =
        res.success &&
        before?.booking === null &&
        after?.status === "FILLED" &&
        booking?.payment?.status === "SUCCEEDED";

      if (ok) {
        console.log("PASS ✅");
        passed++;
      } else {
        console.log("FAIL ❌", { res, beforeStatus: before?.status, afterStatus: after?.status });
      }
    }
  }

  console.log("\n=== TEST 2 : Échec + rollback (double acceptation) ===");
  total++;

  // On prend une autre demande OPEN (si possible) avec 2 offres PENDING
  const req2 = await prisma.serviceRequest.findFirst({
    where: { status: "OPEN", booking: null },
    include: { offers: true },
  });

  if (!req2) {
    console.log("SKIP: aucune demande OPEN trouvée pour test 2.");
  } else {
    const offers = await prisma.offer.findMany({
      where: { requestId: req2.id, status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 2,
    });

    if (offers.length < 2) {
      console.log("SKIP: besoin de 2 offres PENDING pour simuler double acceptation.");
    } else {
      const [o1, o2] = offers;

      // Lancer 2 acceptations "en même temps"
      const [r1, r2] = await Promise.all([
        acceptOfferAndCreateBooking({ requestId: req2.id, offerId: o1.id }),
        acceptOfferAndCreateBooking({ requestId: req2.id, offerId: o2.id }),
      ]);

      const bookingCount = await prisma.booking.count({
        where: { requestId: req2.id },
      });

      const finalReq = await prisma.serviceRequest.findUnique({
        where: { id: req2.id },
        include: { booking: true },
      });

      // Attendu: exactement 1 booking créé, et l'autre transaction échoue
      const ok =
        bookingCount === 1 &&
        finalReq?.status === "FILLED" &&
        ((r1.success && !r2.success) || (!r1.success && r2.success));

      if (ok) {
        console.log("PASS ✅", { r1, r2, bookingCount });
        passed++;
      } else {
        console.log("FAIL ❌", { r1, r2, bookingCount, finalStatus: finalReq?.status });
      }
    }
  }

  console.log("\n=== RESULTATS ===");
  console.log(`${passed} tests passés / ${total} tests au total`);
}

testTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect()); // Sonia Corbin