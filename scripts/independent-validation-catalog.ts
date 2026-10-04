// Read-only catalog audit. A socket match is not a physical fit certification.
import { BAGS } from "../src/data/bags.ts";
import { TAILFIN_CATALOG } from "../src/data/tailfin.ts";
import { BIKES } from "../src/data/bikes.ts";
import { getSocketAnchors } from "../src/lib/sockets.ts";
import { getEquipmentDimensions } from "../src/lib/equipmentGeometry.ts";
const products = TAILFIN_CATALOG;
const ids = products.map((item) => item.id);
const bikes = BIKES.filter((bike) => bike.brand === "Santa Cruz");
const summary = {
  totalTailfinEntries: products.length,
  duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
  verifiedDimensions: products.filter(
    (item) => getEquipmentDimensions(item, { allowEstimate: false }) !== null,
  ).length,
  unknownWeights: products.filter((item) => item.dryWeightGrams === null)
    .length,
  unknownCapacities: products.filter((item) => item.volumeLiters === null)
    .length,
  kinds: Object.fromEntries(
    Array.from(
      new Set(products.map((item) => item.productKind ?? "unspecified")),
    ).map((kind) => [
      kind,
      products.filter((item) => (item.productKind ?? "unspecified") === kind)
        .length,
    ]),
  ),
  referenceOnlyEntries: products.filter((item) => item.referenceOnly).length,
  noStructuralSocketOnEitherBike: products
    .filter(
      (item) =>
        !item.referenceOnly &&
        !bikes.some((bike) =>
          Object.values(bike.sizes).some((size) =>
            getSocketAnchors(size).some(
              (socket) =>
                socket.allowedBagCategories.includes(item.category) &&
                item.compatibleSockets.includes(socket.id),
            ),
          ),
        ),
    )
    .map((item) => ({
      id: item.id,
      kind: item.productKind,
      category: item.category,
    })),
  missingCapabilityProviders: Array.from(
    new Set(products.flatMap((item) => item.requires ?? [])),
  ).filter(
    (capability) =>
      !BAGS.some(
        (item) => item.id === capability || item.provides?.includes(capability),
      ),
  ),
  missingSources: products
    .filter((item) => !item.productUrl?.startsWith("https://www.tailfin.cc/"))
    .map((item) => item.id),
};
console.log(JSON.stringify(summary, null, 2));
