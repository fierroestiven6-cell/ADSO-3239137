const apiMessageTranslations = new Map([
  ["invalid credentials.", "El correo electrónico o la contraseña no son correctos."],
  ["the given data was invalid.", "Los datos proporcionados no son válidos."],
  ["unauthenticated.", "Tu sesión no es válida. Inicia sesión nuevamente."],
  ["login successful.", "Inicio de sesión correcto."],
  ["logout successful.", "La sesión se cerró correctamente."],
  ["user registered successfully.", "El usuario se registró correctamente."],
  ["beneficiary created successfully.", "El beneficiario se creó correctamente."],
  ["beneficiary updated successfully.", "Los datos del beneficiario se actualizaron correctamente."],
  ["beneficiary deleted successfully.", "El beneficiario se eliminó correctamente."],
  ["beneficiaries with loan history cannot be deleted.", "No se pueden eliminar beneficiarios con préstamos registrados."],
  ["at least one field must be provided for the update.", "Debes proporcionar al menos un campo para actualizar el registro."],
  ["technical aid created successfully.", "La ayuda técnica se creó correctamente."],
  ["technical aid updated successfully.", "La ayuda técnica se actualizó correctamente."],
  ["technical aid deleted successfully.", "La ayuda técnica se eliminó correctamente."],
  ["loan created successfully.", "El préstamo se registró correctamente."],
  ["loan returned successfully.", "La devolución se registró correctamente."],
]);

const categoryTranslations = new Map([
  ["cane", "Bastón"],
  ["canes", "Bastones"],
  ["cushion", "Cojín"],
  ["cushions", "Cojines"],
  ["crutch", "Muleta"],
  ["crutches", "Muletas"],
  ["uncategorized", "Sin categoría"],
  ["walker", "Caminador"],
  ["walkers", "Caminadores"],
  ["wheelchair", "Silla de ruedas"],
  ["wheelchairs", "Sillas de ruedas"],
]);

const spanishMessagePattern =
  /\b(el|la|los|las|un|una|de|del|no|por|para|debes|debe|correo|contraseña|ayuda|pr[eé]stamo|beneficiari[oa]|registrad[oa]|correctamente|inv[aá]lid[oa]|requerid[oa])\b/i;

function getErrorDetails(errors) {
  if (Array.isArray(errors)) {
    return errors;
  }

  if (!errors || typeof errors !== "object") {
    return [];
  }

  return Object.values(errors).flat();
}

export function localizeUiMessage(message, fallback = "") {
  const normalizedMessage = String(message ?? "").trim();

  if (!normalizedMessage) {
    return fallback;
  }

  const translatedMessage = apiMessageTranslations.get(
    normalizedMessage.toLowerCase(),
  );

  if (translatedMessage) {
    return translatedMessage;
  }

  return spanishMessagePattern.test(normalizedMessage)
    ? normalizedMessage
    : fallback;
}

export function getUiErrorMessage(
  error,
  fallback = "No fue posible completar la operación. Inténtalo nuevamente.",
) {
  const responseErrors = error?.response?.data?.errors;

  const messages = [
    ...getErrorDetails(error?.errors),
    ...getErrorDetails(responseErrors),
    error?.message,
    error?.response?.data?.message,
  ]
    .map((message) => localizeUiMessage(message, ""))
    .filter(Boolean);

  return [...new Set(messages)].join(" ") || fallback;
}

export function localizeCategoryName(categoryName) {
  const normalizedCategory = String(categoryName ?? "").trim();

  if (!normalizedCategory) {
    return "";
  }

  return (
    categoryTranslations.get(normalizedCategory.toLowerCase()) ??
    normalizedCategory
  );
}
