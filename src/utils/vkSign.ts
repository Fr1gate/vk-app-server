import crypto from "crypto";

/**
 * Верифицирует параметры запуска VK согласно официальной документации.
 */
export function verifyLaunchParams(
  params: Record<string, any>,
  secretKey: string
): boolean {
  // Извлекаем подпись
  const sign = params.sign;
  if (!sign) {
    console.error("❌ Подпись не найдена");
    return false;
  }

  // Фильтруем только параметры с префиксом vk_
  const vkParams = [];

  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("vk_")) {
      // Преобразуем значение в строку
      const stringValue = String(value);
      vkParams.push({ key, value: stringValue });
    }
  }

  if (vkParams.length === 0) {
    console.error("❌ Параметры vk_ не найдены");
    return false;
  }

  // 1. Сортируем параметры по имени ключа
  vkParams.sort((a, b) => a.key.localeCompare(b.key));

  // 2. Объединяем пары параметр=значение в одну строку
  // Значения должны быть URL-кодированы
  const queryString = vkParams
    .map(({ key, value }) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  // 3. Вычисляем HMAC-SHA256
  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(queryString);

  // 4. Кодируем в base64 и применяем замены для URL-safe base64
  const paramsHash = hmac
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return paramsHash === sign;
}
