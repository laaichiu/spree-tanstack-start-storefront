import type { MessageKey, SupportedLocale } from './message-catalog'
import { resolveMessageLocale } from './message-catalog'

const seoMessages = {
  en: {
    'account.order': 'Order',
    'cart.cart': 'Cart',
    'cart.emptyCartDescription':
      'Start with new arrivals or browse the full catalog.',
    'checkout.checkout': 'Checkout',
    'checkout.checkoutDescription':
      'Checkout will open once a synced Spree cart is ready.',
    'checkout.confirmPayment': 'Confirm payment',
    'checkout.confirmPaymentDescription':
      'Finalizing your payment and placing your order.',
    'checkout.orderPlaced': 'Order placed',
    'checkout.orderPlacedDescription':
      'Your payment was accepted and your Spree order has been placed.',
    'checkout.orderPlacedUnavailable': 'Order details are unavailable',
    'checkout.orderPlacedUnavailableDescription':
      'We could not verify this completed order from the current checkout session. Continue shopping or contact support with your order reference.',
    'checkout.paymentConfirmationFailed': 'Payment could not be confirmed',
    'collection.collectionDescription':
      'A curated edit of products for this storefront.',
    'collection.collectionUnavailable': 'Collection unavailable',
    'collection.collectionUnavailableDescription':
      'We could not load this collection right now.',
    'home.heroDescription':
      'An easy edit of refined layers, clean silhouettes, and everyday pieces that feel lighter the moment you put them on.',
    'home.heroTitle': 'Shaped by sunlight',
    'newsletterVerification.description':
      'Confirm and review the status of your newsletter subscription.',
    'newsletterVerification.title': 'Newsletter confirmation',
    'notFound.description':
      'The page you are looking for is unavailable or has moved.',
    'notFound.eyebrow': 'Not found',
    'notFound.primaryAction': 'Return home',
    'notFound.secondaryAction': 'Shop products',
    'notFound.title': 'This page is not available.',
    'product.breadcrumbHome': 'Home',
    'product.productUnavailableDescription':
      'We could not load this product right now.',
    'product.products': 'Products',
    'product.productsDescription':
      'Browse the full product catalog for this storefront.',
    'product.searchResultsFor': 'Search results for',
  },
  de: {
    'account.order': 'Bestellung',
    'cart.cart': 'Warenkorb',
    'cart.emptyCartDescription':
      'Beginnen Sie mit den Neuheiten oder durchsuchen Sie den gesamten Katalog.',
    'checkout.checkout': 'Kasse',
    'checkout.checkoutDescription':
      'Die Kasse wird geöffnet, sobald ein synchronisierter Spree-Warenkorb bereit ist.',
    'checkout.confirmPayment': 'Zahlung bestätigen',
    'checkout.confirmPaymentDescription':
      'Ihre Zahlung wird abgeschlossen und Ihre Bestellung aufgegeben.',
    'checkout.orderPlaced': 'Bestellung aufgegeben',
    'checkout.orderPlacedDescription':
      'Ihre Zahlung wurde akzeptiert und Ihre Spree-Bestellung aufgegeben.',
    'checkout.orderPlacedUnavailable': 'Bestelldetails nicht verfügbar',
    'checkout.orderPlacedUnavailableDescription':
      'Diese abgeschlossene Bestellung konnte in der aktuellen Kassensitzung nicht bestätigt werden. Kaufen Sie weiter ein oder wenden Sie sich mit Ihrer Bestellreferenz an den Support.',
    'checkout.paymentConfirmationFailed':
      'Zahlung konnte nicht bestätigt werden',
    'collection.collectionDescription':
      'Eine kuratierte Produktauswahl für diesen Store.',
    'collection.collectionUnavailable': 'Kollektion nicht verfügbar',
    'collection.collectionUnavailableDescription':
      'Diese Kollektion konnte gerade nicht geladen werden.',
    'home.heroDescription':
      'Eine leichte Auswahl aus feinen Lagen, klaren Silhouetten und Alltagsstücken, die sich vom ersten Moment an luftiger anfühlen.',
    'home.heroTitle': 'Vom Sonnenlicht geformt',
    'newsletterVerification.description':
      'Bestätigen Sie Ihre Newsletter-Anmeldung und prüfen Sie ihren Status.',
    'newsletterVerification.title': 'Newsletter-Bestätigung',
    'notFound.description':
      'Die gesuchte Seite ist nicht verfügbar oder wurde verschoben.',
    'notFound.eyebrow': 'Nicht gefunden',
    'notFound.primaryAction': 'Zur Startseite',
    'notFound.secondaryAction': 'Produkte ansehen',
    'notFound.title': 'Diese Seite ist nicht verfügbar.',
    'product.breadcrumbHome': 'Startseite',
    'product.productUnavailableDescription':
      'Dieses Produkt konnte gerade nicht geladen werden.',
    'product.products': 'Produkte',
    'product.productsDescription':
      'Durchsuchen Sie den vollständigen Produktkatalog dieses Stores.',
    'product.searchResultsFor': 'Suchergebnisse für',
  },
  es: {
    'account.order': 'Pedido',
    'cart.cart': 'Carrito',
    'cart.emptyCartDescription':
      'Empieza por novedades o explora todo el catalogo.',
    'checkout.checkout': 'Checkout',
    'checkout.checkoutDescription':
      'Checkout se abrira cuando haya un carrito Spree sincronizado.',
    'checkout.confirmPayment': 'Confirmar pago',
    'checkout.confirmPaymentDescription':
      'Finalizando tu pago y realizando el pedido.',
    'checkout.orderPlaced': 'Pedido realizado',
    'checkout.orderPlacedDescription':
      'Tu pago fue aceptado y tu pedido de Spree se ha realizado.',
    'checkout.orderPlacedUnavailable':
      'Los detalles del pedido no estan disponibles',
    'checkout.orderPlacedUnavailableDescription':
      'No pudimos verificar este pedido completado desde la sesion de checkout actual. Sigue comprando o contacta con soporte con tu referencia de pedido.',
    'checkout.paymentConfirmationFailed': 'No se pudo confirmar el pago',
    'collection.collectionDescription':
      'Una seleccion curada de productos para esta tienda.',
    'collection.collectionUnavailable': 'Coleccion no disponible',
    'collection.collectionUnavailableDescription':
      'No pudimos cargar esta coleccion ahora mismo.',
    'home.heroDescription':
      'Una seleccion sencilla de capas refinadas, siluetas limpias y piezas diarias que se sienten mas ligeras al ponertelas.',
    'home.heroTitle': 'Moldeado por la luz',
    'newsletterVerification.description':
      'Confirma y revisa el estado de tu suscripcion al boletin.',
    'newsletterVerification.title': 'Confirmacion del boletin',
    'notFound.description':
      'La pagina que buscas no esta disponible o se ha movido.',
    'notFound.eyebrow': 'No encontrada',
    'notFound.primaryAction': 'Volver al inicio',
    'notFound.secondaryAction': 'Ver productos',
    'notFound.title': 'Esta pagina no esta disponible.',
    'product.breadcrumbHome': 'Inicio',
    'product.productUnavailableDescription':
      'No pudimos cargar este producto ahora mismo.',
    'product.products': 'Productos',
    'product.productsDescription':
      'Explora todo el catalogo de productos de esta tienda.',
    'product.searchResultsFor': 'Resultados para',
  },
  fr: {
    'account.order': 'Commande',
    'cart.cart': 'Panier',
    'cart.emptyCartDescription':
      'Commencez par les nouveautes ou parcourez tout le catalogue.',
    'checkout.checkout': 'Paiement',
    'checkout.checkoutDescription':
      "Le paiement s'ouvrira lorsqu'un panier Spree synchronise sera pret.",
    'checkout.confirmPayment': 'Confirmer le paiement',
    'checkout.confirmPaymentDescription':
      'Finalisation du paiement et validation de votre commande.',
    'checkout.orderPlaced': 'Commande passee',
    'checkout.orderPlacedDescription':
      'Votre paiement a ete accepte et votre commande Spree a ete passee.',
    'checkout.orderPlacedUnavailable':
      'Les details de la commande sont indisponibles',
    'checkout.orderPlacedUnavailableDescription':
      "Nous n'avons pas pu verifier cette commande finalisee depuis la session de paiement actuelle. Continuez vos achats ou contactez le support avec votre reference de commande.",
    'checkout.paymentConfirmationFailed':
      "Le paiement n'a pas pu etre confirme",
    'collection.collectionDescription':
      'Une selection de produits pour cette boutique.',
    'collection.collectionUnavailable': 'Collection indisponible',
    'collection.collectionUnavailableDescription':
      "Nous n'avons pas pu charger cette collection pour le moment.",
    'home.heroDescription':
      'Une selection facile de superpositions raffinees, de lignes nettes et de pieces du quotidien qui semblent plus legeres des que vous les portez.',
    'home.heroTitle': 'Faconne par la lumiere',
    'newsletterVerification.description':
      'Confirmez et consultez le statut de votre inscription a la newsletter.',
    'newsletterVerification.title': 'Confirmation de newsletter',
    'notFound.description':
      'La page que vous recherchez est indisponible ou a ete deplacee.',
    'notFound.eyebrow': 'Introuvable',
    'notFound.primaryAction': "Retour a l'accueil",
    'notFound.secondaryAction': 'Voir les produits',
    'notFound.title': "Cette page n'est pas disponible.",
    'product.breadcrumbHome': 'Accueil',
    'product.productUnavailableDescription':
      "Nous n'avons pas pu charger ce produit pour le moment.",
    'product.products': 'Produits',
    'product.productsDescription':
      'Parcourez tout le catalogue de produits de cette boutique.',
    'product.searchResultsFor': 'Resultats pour',
  },
  ja: {
    'account.order': '注文',
    'cart.cart': 'カート',
    'cart.emptyCartDescription':
      '新着商品から始めるか、すべての商品をご覧ください。',
    'checkout.checkout': 'チェックアウト',
    'checkout.checkoutDescription':
      '同期された Spree カートが準備できるとチェックアウトを開始できます。',
    'checkout.confirmPayment': '支払いを確認',
    'checkout.confirmPaymentDescription':
      '支払いを確定し、注文を完了しています。',
    'checkout.orderPlaced': '注文完了',
    'checkout.orderPlacedDescription':
      '支払いが承認され、Spree 注文が作成されました。',
    'checkout.orderPlacedUnavailable': '注文詳細を表示できません',
    'checkout.orderPlacedUnavailableDescription':
      '現在のチェックアウトセッションから完了済み注文を確認できませんでした。買い物を続けるか、注文番号を添えてサポートにお問い合わせください。',
    'checkout.paymentConfirmationFailed': '支払いを確認できませんでした',
    'collection.collectionDescription':
      'このストアのために編集された商品の一覧です。',
    'collection.collectionUnavailable': 'コレクションを表示できません',
    'collection.collectionUnavailableDescription':
      '現在このコレクションを読み込めません。',
    'home.heroDescription':
      '洗練されたレイヤー、すっきりしたシルエット、日常を軽やかにするアイテム。',
    'home.heroTitle': '光にかたどられて',
    'newsletterVerification.description':
      'ニュースレター登録の確認状況を確認します。',
    'newsletterVerification.title': 'ニュースレター確認',
    'notFound.description':
      'お探しのページは利用できないか、移動した可能性があります。',
    'notFound.eyebrow': '見つかりません',
    'notFound.primaryAction': 'ホームに戻る',
    'notFound.secondaryAction': '商品を見る',
    'notFound.title': 'このページは利用できません。',
    'product.breadcrumbHome': 'ホーム',
    'product.productUnavailableDescription': '現在この商品を読み込めません。',
    'product.products': '商品',
    'product.productsDescription': 'このストアの商品をすべてご覧いただけます。',
    'product.searchResultsFor': '検索結果',
  },
} satisfies Record<SupportedLocale, Partial<Record<MessageKey, string>>>

export function translateMessage(locale: string, key: MessageKey) {
  const resolvedLocale = resolveMessageLocale(locale)
  const localizedMessages = seoMessages[resolvedLocale] as Partial<
    Record<MessageKey, string>
  >
  const englishMessages = seoMessages.en as Partial<Record<MessageKey, string>>

  return localizedMessages[key] ?? englishMessages[key] ?? key
}
