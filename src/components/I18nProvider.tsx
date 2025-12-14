import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';

type LangCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ru' | 'tr' | 'ar';

type Dict = Record<string, Record<LangCode, string>>;

const dict: Dict = {
  settings_title: {
    en: 'Settings', es: 'Configuración', fr: 'Paramètres', de: 'Einstellungen', pt: 'Configurações', ru: 'Настройки', tr: 'Ayarlar', ar: 'الإعدادات'
  },
  profile: {
    en: 'Profile', es: 'Perfil', fr: 'Profil', de: 'Profil', pt: 'Perfil', ru: 'Профиль', tr: 'Profil', ar: 'الملف الشخصي'
  },
  username: {
    en: 'Username', es: 'Usuario', fr: 'Nom d’utilisateur', de: 'Benutzername', pt: 'Usuário', ru: 'Имя пользователя', tr: 'Kullanıcı adı', ar: 'اسم المستخدم'
  },
  id_label: {
    en: 'Rhizanode ID', es: 'Rhizanode ID', fr: 'Rhizanode ID', de: 'Rhizanode ID', pt: 'Rhizanode ID', ru: 'Rhizanode ID', tr: 'Rhizanode ID', ar: 'معرف Rhizanode'
  },
  sponsor_code: {
    en: 'Sponsor Code', es: 'Código de patrocinador', fr: 'Code de parrain', de: 'Sponsorcode', pt: 'Código do patrocinador', ru: 'Код спонсора', tr: 'Sponsor Kodu', ar: 'رمز الراعي'
  },
  wallet: {
    en: 'Wallet', es: 'Billetera', fr: 'Portefeuille', de: 'Wallet', pt: 'Carteira', ru: 'Кошелёк', tr: 'Cüzdan', ar: 'المحفظة'
  },
  status: {
    en: 'Status', es: 'Estado', fr: 'Statut', de: 'Status', pt: 'Status', ru: 'Статус', tr: 'Durum', ar: 'الحالة'
  },
  connected: {
    en: 'Connected', es: 'Conectado', fr: 'Connecté', de: 'Verbunden', pt: 'Conectado', ru: 'Подключено', tr: 'Bağlı', ar: 'متصل'
  },
  address: {
    en: 'Address', es: 'Dirección', fr: 'Adresse', de: 'Adresse', pt: 'Endereço', ru: 'Адрес', tr: 'Adres', ar: 'العنوان'
  },
  disconnect_wallet: {
    en: 'Disconnect Wallet', es: 'Desconectar cartera', fr: 'Déconnecter le portefeuille', de: 'Wallet trennen', pt: 'Desconectar carteira', ru: 'Отключить кошелёк', tr: 'Cüzdanı Ayır', ar: 'افصل المحفظة'
  },
  wallet_not_connected: {
    en: 'Wallet not connected.', es: 'Billetera no conectada.', fr: 'Portefeuille non connecté.', de: 'Wallet nicht verbunden.', pt: 'Carteira não conectada.', ru: 'Кошелёк не подключён.', tr: 'Cüzdan bağlı değil.', ar: 'المحفظة غير متصلة.'
  },
  connect_wallet: {
    en: 'Connect Wallet', es: 'Conectar billetera', fr: 'Connecter le portefeuille', de: 'Wallet verbinden', pt: 'Conectar carteira', ru: 'Подключить кошелёк', tr: 'Cüzdanı Bağla', ar: 'اتصال المحفظة'
  },
  app_settings: {
    en: 'App Settings', es: 'Ajustes de la app', fr: 'Paramètres de l’app', de: 'App-Einstellungen', pt: 'Configurações do app', ru: 'Настройки приложения', tr: 'Uygulama Ayarları', ar: 'إعدادات التطبيق'
  },
  notifications: {
    en: 'Notifications', es: 'Notificaciones', fr: 'Notifications', de: 'Benachrichtigungen', pt: 'Notificações', ru: 'Уведомления', tr: 'Bildirimler', ar: 'الإشعارات'
  },
  language: {
    en: 'Language', es: 'Idioma', fr: 'Langue', de: 'Sprache', pt: 'Idioma', ru: 'Язык', tr: 'Dil', ar: 'اللغة'
  },
  // ArcadeMiningUI keys
  rzc_core_title: { en: 'RZC Mining Core', es: 'Núcleo de Minería RZC', fr: 'Noyau de minage RZC', de: 'RZC Mining Kern', pt: 'Núcleo de Mineração RZC', ru: 'Ядро майнинга RZC', tr: 'RZC Madencilik Çekirdeği', ar: 'نواة تعدين RZC' },
  rzc_core_subtitle: { en: 'Decentralized Yield Protocol', es: 'Protocolo de Rendimiento Descentralizado', fr: 'Protocole de rendement décentralisé', de: 'Dezentrales Ertragsprotokoll', pt: 'Protocolo de Rendimento Descentralizado', ru: 'Децентрализованный доходный протокол', tr: 'Merkezsiz Getiri Protokolü', ar: 'بروتوكول عوائد لامركزي' },
  your_referral_code: { en: 'Your Referral Code', es: 'Tu código de referido', fr: 'Votre code de parrainage', de: 'Dein Empfehlungscode', pt: 'Seu código de referência', ru: 'Ваш реферальный код', tr: 'Yönlendirme Kodunuz', ar: 'رمز الإحالة الخاص بك' },
  share_to_build: { en: 'Share to build your network', es: 'Comparte para construir tu red', fr: 'Partagez pour développer votre réseau', de: 'Teile, um dein Netzwerk aufzubauen', pt: 'Compartilhe para construir sua rede', ru: 'Делитесь, чтобы развивать сеть', tr: 'Ağını büyütmek için paylaş', ar: 'شارك لبناء شبكتك' },
  copy: { en: 'Copy', es: 'Copiar', fr: 'Copier', de: 'Kopieren', pt: 'Copiar', ru: 'Копировать', tr: 'Kopyala', ar: 'نسخ' },
  copy_success: { en: 'Referral Link copied!', es: '¡Enlace copiado!', fr: 'Lien copié !', de: 'Link kopiert!', pt: 'Link copiado!', ru: 'Ссылка скопирована!', tr: 'Bağlantı kopyalandı!', ar: 'تم نسخ الرابط!' },
  copy_failed: { en: 'Failed to copy Link!', es: '¡Error al copiar el enlace!', fr: "Échec de la copie du lien !", de: 'Link konnte nicht kopiert werden!', pt: 'Falha ao copiar o link!', ru: 'Не удалось скопировать ссылку!', tr: 'Bağlantı kopyalanamadı!', ar: 'فشل نسخ الرابط!' },
  total_rzc_balance: { en: 'Rhizacore Balance', es: 'Saldo de Rhizacore', fr: 'Solde Rhizacore', de: 'Rhizacore-Guthaben', pt: 'Saldo Rhizacore', ru: 'Баланс Rhizacore', tr: 'Rhizacore Bakiyesi', ar: 'رصيد Rhizacore' },
  mining_label: { en: 'Mining:', es: 'Minería:', fr: 'Minage :', de: 'Mining:', pt: 'Mineração:', ru: 'Майнинг:', tr: 'Madencilik:', ar: 'التعدين:' },
  validated_label: { en: 'Validated:', es: 'Validado:', fr: 'Validé :', de: 'Bestätigt:', pt: 'Validado:', ru: 'Подтверждено:', tr: 'Doğrulandı:', ar: 'تم التحقق:' },
  mining_in_progress: { en: 'MINING IN PROGRESS', es: 'MINERÍA EN CURSO', fr: 'MINAGE EN COURS', de: 'MINING LÄUFT', pt: 'MINERAÇÃO EM ANDAMENTO', ru: 'МАЙНИНГ ИДЁТ', tr: 'MADENCİLİK DEVAM EDİYOR', ar: 'التعدين جارٍ' },
  mining_unavailable: { en: 'MINING UNAVAILABLE', es: 'MINERÍA NO DISPONIBLE', fr: 'MINAGE INDISPONIBLE', de: 'MINING NICHT VERFÜGBAR', pt: 'MINERAÇÃO INDISPONÍVEL', ru: 'МАЙНИНГ НЕДОСТУПЕН', tr: 'MADENCİLİK KULLANILAMAZ', ar: 'التعدين غير متاح' },
  initiate_mining: { en: 'INITIATE MINING SEQUENCE', es: 'INICIAR SECUENCIA DE MINERÍA', fr: 'DÉMARRER LE MINAGE', de: 'MINING SEQUENZ STARTEN', pt: 'INICIAR MINERAÇÃO', ru: 'ЗАПУСТИТЬ МАЙНИНГ', tr: 'MADENCİLİĞİ BAŞLAT', ar: 'بدء عملية التعدين' },
  system_online: { en: 'SYSTEM ONLINE', es: 'SISTEMA EN LÍNEA', fr: 'SYSTÈME EN LIGNE', de: 'SYSTEM ONLINE', pt: 'SISTEMA ONLINE', ru: 'СИСТЕМА АКТИВНА', tr: 'SİSTEM AKTİF', ar: 'النظام متصل' },
  system_standby: { en: 'SYSTEM STANDBY', es: 'SISTEMA EN ESPERA', fr: 'SYSTÈME EN VEILLE', de: 'SYSTEM BEREIT', pt: 'SISTEMA EM ESPERA', ru: 'СИСТЕМА В ОЖИДАНИИ', tr: 'SİSTEM BEKLEMEDE', ar: 'النظام في وضع الاستعداد' },
  session_ends_in: { en: 'SESSION ENDS IN', es: 'SESIÓN TERMINA EN', fr: 'FIN DE SESSION DANS', de: 'SITZUNG ENDET IN', pt: 'SESSÃO TERMINA EM', ru: 'СЕССИЯ ЗАКОНЧИТСЯ ЧЕРЕЗ', tr: 'OTURUM BİTİŞİ', ar: 'تنتهي الجلسة خلال' },
  continuous_mining: { en: 'CONTINUOUS MINING ENABLED', es: 'MINERÍA CONTINUA ACTIVADA', fr: 'MINAGE CONTINU ACTIVÉ', de: 'KONTINUIERLICHES MINING AKTIV', pt: 'MINERAÇÃO CONTÍNUA ATIVA', ru: 'НЕПРЕРЫВНЫЙ МАЙНИНГ ВКЛЮЧЕН', tr: 'SÜREKLİ MADENCİLİK ETKİN', ar: 'تم تمكين التعدين المستمر' },
  validating_node: { en: 'VALIDATING RHIZANODE', es: 'VALIDANDO RHIZANODE', fr: 'VALIDATION DU RHIZANODE', de: 'RHIZANODE VALIDIEREN', pt: 'VALIDANDO RHIZANODE', ru: 'ПРОВЕРКА RHIZANODE', tr: 'RHIZANODE DOĞRULANIYOR', ar: 'التحقق من RHIZANODE' },
  ready_to_mine: { en: 'READY TO MINE NODE', es: 'LISTO PARA MINAR NODO', fr: 'PRÊT À MINER LE NŒUD', de: 'BEREIT ZUM MINEN', pt: 'PRONTO PARA MINERAR', ru: 'ГОТОВ К МАЙНИНГУ', tr: 'MADENCİLİĞE HAZIR', ar: 'جاهز للتعدين' },
  session_progress: { en: 'Session Progress', es: 'Progreso de la sesión', fr: 'Progression de la session', de: 'Sitzungsfortschritt', pt: 'Progresso da sessão', ru: 'Прогресс сессии', tr: 'Oturum İlerlemesi', ar: 'تقدم الجلسة' },
  claimable: { en: 'Claimable', es: 'Reclamable', fr: 'Réclamable', de: 'Einlösbar', pt: 'Resgatável', ru: 'Доступно', tr: 'Talep edilebilir', ar: 'قابل للتحصيل' },
  total: { en: 'Total', es: 'Total', fr: 'Total', de: 'Gesamt', pt: 'Total', ru: 'Итого', tr: 'Toplam', ar: 'الإجمالي' },
  // TonWallet keys
  connect_wallet_title: { en: 'Connect Wallet', es: 'Conectar billetera', fr: 'Connecter le portefeuille', de: 'Wallet verbinden', pt: 'Conectar carteira', ru: 'Подключить кошелёк', tr: 'Cüzdanı Bağla', ar: 'اتصال المحفظة' },
  connect_wallet_desc: { en: 'Connect your TON wallet to manage assets', es: 'Conecta tu billetera TON para gestionar activos', fr: 'Connectez votre portefeuille TON pour gérer vos actifs', de: 'Verbinden Sie Ihre TON-Wallet, um Vermögenswerte zu verwalten', pt: 'Conecte sua carteira TON para gerenciar ativos', ru: 'Подключите кошелёк TON для управления активами', tr: 'Varlıklarınızı yönetmek için TON cüzdanınızı bağlayın', ar: 'قم بتوصيل محفظة TON لإدارة الأصول' },
  wallet_features: { en: 'Wallet Features', es: 'Funcionalidades da carteira', fr: 'Fonctionnalités du portefeuille', de: 'Wallet-Funktionen', pt: 'Recursos da carteira', ru: 'Функции кошелька', tr: 'Cüzdan Özellikleri', ar: 'ميزات المحفظة' },
  feature_secure: { en: 'Secure', es: 'Seguro', fr: 'Sécurisé', de: 'Sicher', pt: 'Seguro', ru: 'Безопасно', tr: 'Güvenli', ar: 'آمن' },
  feature_secure_desc: { en: 'Your keys, your control', es: 'Tus llaves, tu control', fr: 'Vos clés, votre contrôle', de: 'Ihre Schlüssel, Ihre Kontrolle', pt: 'Suas chaves, seu controle', ru: 'Ваши ключи, ваш контроль', tr: 'Anahtarlarınız, kontrolünüz', ar: 'مفاتيحك، تحكمك' },
  feature_fast: { en: 'Fast', es: 'Rápido', fr: 'Rapide', de: 'Schnell', pt: 'Rápido', ru: 'Быстро', tr: 'Hızlı', ar: 'سريع' },
  feature_fast_desc: { en: 'Lightning-fast transactions', es: 'Transacciones ultrarrápidas', fr: 'Transactions ultra-rapides', de: 'Blitzschnelle Transaktionen', pt: 'Transações ultrarrápidas', ru: 'Молниеносные транзакции', tr: 'Yıldırım hızında işlemler', ar: 'معاملات فائقة السرعة' },
  feature_ecosystem: { en: 'Ecosystem', es: 'Ecossistema', fr: 'Écosystème', de: 'Ökosystem', pt: 'Ecossistema', ru: 'Экосистема', tr: 'Ekosistem', ar: 'النظام البيئي' },
  feature_ecosystem_desc: { en: 'Full TON network support', es: 'Soporte completo de red TON', fr: 'Support complet du réseau TON', de: 'Vollständige TON-Netzwerkunterstützung', pt: 'Suporte completo da rede TON', ru: 'Полная поддержка сети TON', tr: 'Tam TON ağ desteği', ar: 'دعم كامل لشبكة TON' },
  feature_jettons: { en: 'Jettons', es: 'Jettons', fr: 'Jettons', de: 'Jettons', pt: 'Jettons', ru: 'Джеттоны', tr: 'Jettonlar', ar: 'Jettons' },
  feature_jettons_desc: { en: 'Multi-token support', es: 'Soporte multi-token', fr: 'Support multi-jetons', de: 'Multi-Token-Unterstützung', pt: 'Suporte multi-token', ru: 'Поддержка нескольких токенов', tr: 'Çoklu token desteği', ar: 'دعم متعدد الرموز' },
  rhiza_mini_wallet: { en: 'Rhiza Mini Wallet', es: 'Rhiza Mini Wallet', fr: 'Rhiza Mini Wallet', de: 'Rhiza Mini Wallet', pt: 'Rhiza Mini Wallet', ru: 'Rhiza Mini Wallet', tr: 'Rhiza Mini Wallet', ar: 'محفظة Rhiza Mini' },
  available: { en: 'Available', es: 'Disponible', fr: 'Disponible', de: 'Verfügbar', pt: 'Disponível', ru: 'Доступно', tr: 'Mevcut', ar: 'المتاح' },
  recipient_address: { en: 'Recipient Address', es: 'Dirección del destinatario', fr: 'Adresse du destinataire', de: 'Empfängeradresse', pt: 'Endereço do destinatário', ru: 'Адрес получателя', tr: 'Alıcı Adresi', ar: 'عنوان المستلم' },
  amount: { en: 'Amount', es: 'Monto', fr: 'Montant', de: 'Betrag', pt: 'Valor', ru: 'Сумма', tr: 'Tutar', ar: 'المبلغ' },
  max: { en: 'MAX', es: 'MÁX', fr: 'MAX', de: 'MAX', pt: 'MÁX', ru: 'MAX', tr: 'MAKS', ar: 'الحد' },
  cancel: { en: 'Cancel', es: 'Cancelar', fr: 'Annuler', de: 'Abbrechen', pt: 'Cancelar', ru: 'Отмена', tr: 'İptal', ar: 'إلغاء' },
  send: { en: 'Send', es: 'Enviar', fr: 'Envoyer', de: 'Senden', pt: 'Enviar', ru: 'Отправить', tr: 'Gönder', ar: 'إرسال' },
  send_ton: { en: 'Send TON', es: 'Enviar TON', fr: 'Envoyer TON', de: 'TON senden', pt: 'Enviar TON', ru: 'Отправить TON', tr: 'TON Gönder', ar: 'إرسال TON' },
  receive_ton: { en: 'Receive TON', es: 'Recibir TON', fr: 'Recevoir TON', de: 'TON empfangen', pt: 'Receber TON', ru: 'Получить TON', tr: 'TON Al', ar: 'استلام TON' },
  share_address: { en: 'Share your address', es: 'Comparte tu dirección', fr: 'Partagez votre adresse', de: 'Teilen Sie Ihre Adresse', pt: 'Compartilhe seu endereço', ru: 'Поделитесь адресом', tr: 'Adresinizi paylaşın', ar: 'شارك عنوانك' },
  your_ton_address: { en: 'Your TON Address', es: 'Tu dirección TON', fr: 'Votre adresse TON', de: 'Ihre TON-Adresse', pt: 'Seu endereço TON', ru: 'Ваш адрес TON', tr: 'TON Adresiniz', ar: 'عنوان TON الخاص بك' },
  assets: { en: 'Assets', es: 'Activos', fr: 'Actifs', de: 'Vermögenswerte', pt: 'Ativos', ru: 'Активы', tr: 'Varlıklar', ar: 'الأصول' },
  // Upgrade-related translations
  mining_upgrades: { en: 'Mining Upgrades', es: 'Mejoras de Minería', fr: 'Mises à Niveau de Minage', de: 'Mining-Upgrades', pt: 'Atualizações de Mineração', ru: 'Улучшения Майнинга', tr: 'Madencilik Yükseltmeleri', ar: 'ترقيات التعدين' },
  mining_rig_mk2: { en: 'Mining Rig Mk. II', es: 'Plataforma de Minería Mk. II', fr: 'Rig de Minage Mk. II', de: 'Mining-Rig Mk. II', pt: 'Plataforma de Mineração Mk. II', ru: 'Майнинг-ферма Mk. II', tr: 'Madencilik Rig Mk. II', ar: 'جهاز التعدين Mk. II' },
  increases_mining_rate: { en: 'Increases mining rate by 25%.', es: 'Aumenta la tasa de minería en un 25%.', fr: 'Augmente le taux de minage de 25%.', de: 'Erhöht die Mining-Rate um 25%.', pt: 'Aumenta a taxa de mineração em 25%.', ru: 'Увеличивает скорость майнинга на 25%.', tr: 'Madencilik oranını %25 artırır.', ar: 'يزيد معدل التعدين بنسبة 25%.' },
  extended_session: { en: 'Extended Session', es: 'Sesión Extendida', fr: 'Session Étendue', de: 'Erweiterte Sitzung', pt: 'Sessão Estendida', ru: 'Расширенная Сессия', tr: 'Uzatılmış Oturum', ar: 'جلسة ممتدة' },
  allows_mining_48h: { en: 'Allows mining for 48 hours.', es: 'Permite minar durante 48 horas.', fr: 'Permet de miner pendant 48 heures.', de: 'Ermöglicht Mining für 48 Stunden.', pt: 'Permite mineração por 48 horas.', ru: 'Позволяет майнить в течение 48 часов.', tr: '48 saat boyunca madencilik yapılmasına izin verir.', ar: 'يسمح بالتعدين لمدة 48 ساعة.' },
  more_upgrades_coming: { en: 'More upgrades coming soon!', es: '¡Más mejoras próximamente!', fr: 'Plus de mises à niveau à venir !', de: 'Weitere Upgrades folgen in Kürze!', pt: 'Mais atualizações em breve!', ru: 'Скоро появятся новые улучшения!', tr: 'Daha fazla yükseltme yakında geliyor!', ar: 'المزيد من الترقيات قادمة قريبا!' },
  extended_session_check: { en: 'Extended Session Check', es: 'Verificación de Sesión Extendida', fr: 'Vérification de Session Étendue', de: 'Erweiterte Sitzungsprüfung', pt: 'Verificação de Sessão Estendida', ru: 'Проверка Расширенной Сессии', tr: 'Uzatılmış Oturum Kontrolü', ar: 'التحقق من الجلسة الممتدة' },
  expected_48h_current: { en: 'Expected ~48h, current session is ~', es: 'Esperado ~48h, la sesión actual es ~', fr: 'Attendu ~48h, la session actuelle est ~', de: 'Erwartet ~48h, aktuelle Sitzung ist ~', pt: 'Esperado ~48h, a sessão atual é ~', ru: 'Ожидается ~48ч, текущая сессия ~', tr: '~48 saat bekleniyor, mevcut oturum ~', ar: 'المتوقع ~48 ساعة، الجلسة الحالية ~' },
  hours_abbrev: { en: 'h.', es: 'h.', fr: 'h.', de: 'h.', pt: 'h.', ru: 'ч.', tr: 'sa.', ar: 'س.' },
  // Wallet Coming Soon keys
  wallet_coming_soon_title: { en: 'Wallet Coming Soon', es: 'Billetera Próximamente', fr: 'Portefeuille Bientôt Disponible', de: 'Wallet Kommt Bald', pt: 'Carteira Em Breve', ru: 'Кошелёк Скоро', tr: 'Cüzdan Yakında', ar: 'المحفظة قريباً' },
  wallet_coming_soon_desc: { en: 'We\'re building something amazing! Our wallet feature is under development and will be available soon.', es: '¡Estamos construyendo algo increíble! Nuestra función de billetera está en desarrollo y estará disponible pronto.', fr: 'Nous construisons quelque chose d\'incroyable ! Notre fonctionnalité de portefeuille est en cours de développement et sera bientôt disponible.', de: 'Wir bauen etwas Großartiges! Unsere Wallet-Funktion befindet sich in der Entwicklung und wird bald verfügbar sein.', pt: 'Estamos construindo algo incrível! Nossa funcionalidade de carteira está em desenvolvimento e estará disponível em breve.', ru: 'Мы создаём что-то потрясающее! Функция кошелька находится в разработке и скоро будет доступна.', tr: 'Harika bir şey inşa ediyoruz! Cüzdan özelliğimiz geliştirilme aşamasında ve yakında kullanıma sunulacak.', ar: 'نحن نبني شيئاً رائعاً! ميزة المحفظة قيد التطوير وستكون متاحة قريباً.' },
  wallet_features_preview: { en: 'What to Expect', es: 'Qué Esperar', fr: 'À Quoi S\'attendre', de: 'Was Sie Erwarten Können', pt: 'O Que Esperar', ru: 'Что Ожидать', tr: 'Ne Beklenmeli', ar: 'ما يمكن توقعه' },
  coming_soon: { en: 'Coming Soon', es: 'Próximamente', fr: 'Bientôt Disponible', de: 'Kommt Bald', pt: 'Em Breve', ru: 'Скоро', tr: 'Yakında', ar: 'قريباً' },
  stay_tuned: { en: 'Stay tuned', es: 'Mantente al tanto', fr: 'Restez à l\'écoute', de: 'Bleiben Sie dran', pt: 'Fique atento', ru: 'Следите за обновлениями', tr: 'Bizi takip edin', ar: 'ترقبوا المزيد' },
  development_progress: { en: 'Development Progress', es: 'Progreso del Desarrollo', fr: 'Progrès du Développement', de: 'Entwicklungsfortschritt', pt: 'Progresso do Desenvolvimento', ru: 'Прогресс Разработки', tr: 'Geliştirme İlerlemesi', ar: 'تقدم التطوير' },
  in_progress: { en: 'In Progress', es: 'En Progreso', fr: 'En Cours', de: 'In Bearbeitung', pt: 'Em Andamento', ru: 'В Процессе', tr: 'Devam Ediyor', ar: 'قيد التنفيذ' },
  // RhizaCore AI Coming Soon keys
  ai_evolution_badge: { en: 'Next Evolution of Web3', es: 'Próxima Evolución de Web3', fr: 'Prochaine Évolution du Web3', de: 'Nächste Evolution von Web3', pt: 'Próxima Evolução do Web3', ru: 'Следующая Эволюция Web3', tr: 'Web3\'ün Sonraki Evrimi', ar: 'التطور التالي لـ Web3' },
  ai_hero_title: { en: 'RhizaCore AI', es: 'RhizaCore AI', fr: 'RhizaCore AI', de: 'RhizaCore AI', pt: 'RhizaCore AI', ru: 'RhizaCore AI', tr: 'RhizaCore AI', ar: 'RhizaCore AI' },
  ai_tagline: { en: 'The Next Evolution of Web3', es: 'La Próxima Evolución de Web3', fr: 'La Prochaine Évolution du Web3', de: 'Die Nächste Evolution von Web3', pt: 'A Próxima Evolução do Web3', ru: 'Следующая Эволюция Web3', tr: 'Web3\'ün Sonraki Evrimi', ar: 'التطور التالي لـ Web3' },
  ai_hero_desc: { en: 'Experience the future of decentralized finance with our revolutionary AI Web3 Agent Wallet. An intelligent autonomous system that manages your digital assets, executes smart transactions, and protects your wealth—all on your behalf.', es: 'Experimenta el futuro de las finanzas descentralizadas con nuestra revolucionaria billetera agente Web3 IA. Un sistema autónomo inteligente que gestiona tus activos digitales, ejecuta transacciones inteligentes y protege tu riqueza, todo en tu nombre.', fr: 'Découvrez l\'avenir de la finance décentralisée avec notre portefeuille agent Web3 IA révolutionnaire. Un système autonome intelligent qui gère vos actifs numériques, exécute des transactions intelligentes et protège votre richesse, le tout en votre nom.', de: 'Erleben Sie die Zukunft des dezentralen Finanzwesens mit unserem revolutionären KI Web3 Agent Wallet. Ein intelligentes autonomes System, das Ihre digitalen Vermögenswerte verwaltet, intelligente Transaktionen ausführt und Ihr Vermögen schützt—alles in Ihrem Namen.', pt: 'Experimente o futuro das finanças descentralizadas com nossa revolucionária carteira agente Web3 IA. Um sistema autônomo inteligente que gerencia seus ativos digitais, executa transações inteligentes e protege sua riqueza, tudo em seu nome.', ru: 'Испытайте будущее децентрализованных финансов с нашим революционным ИИ Web3 Агент Кошельком. Интеллектуальная автономная система, которая управляет вашими цифровыми активами, выполняет умные транзакции и защищает ваше богатство—всё от вашего имени.', tr: 'Devrim niteliğindeki AI Web3 Ajan Cüzdanımızla merkezi olmayan finansın geleceğini deneyimleyin. Dijital varlıklarınızı yöneten, akıllı işlemler gerçekleştiren ve servetinizi koruyan akıllı otonom bir sistem—hepsi sizin adınıza.', ar: 'اختبر مستقبل التمويل اللامركزي مع محفظة وكيل Web3 بالذكاء الاصطناعي الثورية. نظام مستقل ذكي يدير أصولك الرقمية وينفذ المعاملات الذكية ويحمي ثروتك—كل ذلك نيابة عنك.' },
  ai_stat_autonomous: { en: 'Autonomous', es: 'Autónomo', fr: 'Autonome', de: 'Autonom', pt: 'Autônomo', ru: 'Автономный', tr: 'Otonom', ar: 'مستقل' },
  ai_stat_speed: { en: 'Speed', es: 'Velocidad', fr: 'Vitesse', de: 'Geschwindigkeit', pt: 'Velocidade', ru: 'Скорость', tr: 'Hız', ar: 'السرعة' },
  ai_stat_secure: { en: 'Secure', es: 'Seguro', fr: 'Sécurisé', de: 'Sicher', pt: 'Seguro', ru: 'Безопасно', tr: 'Güvenli', ar: 'آمن' },
  ai_revolutionary_features: { en: 'Revolutionary', es: 'Revolucionario', fr: 'Révolutionnaire', de: 'Revolutionär', pt: 'Revolucionário', ru: 'Революционный', tr: 'Devrim Niteliğinde', ar: 'ثوري' },
  ai_features_title: { en: 'Powered by Intelligence', es: 'Impulsado por Inteligencia', fr: 'Alimenté par l\'Intelligence', de: 'Angetrieben von Intelligenz', pt: 'Alimentado por Inteligência', ru: 'На Базе Интеллекта', tr: 'Zeka ile Desteklenen', ar: 'مدعوم بالذكاء' },
  ai_features_subtitle: { en: 'Advanced AI capabilities that redefine Web3', es: 'Capacidades avanzadas de IA que redefinen Web3', fr: 'Capacités d\'IA avancées qui redéfinissent Web3', de: 'Fortschrittliche KI-Fähigkeiten, die Web3 neu definieren', pt: 'Capacidades avançadas de IA que redefinem Web3', ru: 'Передовые возможности ИИ, переопределяющие Web3', tr: 'Web3\'ü yeniden tanımlayan gelişmiş AI yetenekleri', ar: 'قدرات ذكاء اصطناعي متقدمة تعيد تعريف Web3' },
  ai_launch_soon: { en: 'Launching Soon', es: 'Lanzamiento Próximo', fr: 'Lancement Prochain', de: 'Startet Bald', pt: 'Lançamento Em Breve', ru: 'Скоро Запуск', tr: 'Yakında Başlıyor', ar: 'قريباً' },
  ai_launch_desc: { en: 'Be among the first to experience the future of Web3', es: 'Sé uno de los primeros en experimentar el futuro de Web3', fr: 'Soyez parmi les premiers à découvrir l\'avenir du Web3', de: 'Seien Sie einer der Ersten, der die Zukunft von Web3 erlebt', pt: 'Seja um dos primeiros a experimentar o futuro do Web3', ru: 'Будьте среди первых, кто испытает будущее Web3', tr: 'Web3\'ün geleceğini deneyimleyen ilk kişiler arasında olun', ar: 'كن من أوائل من يجرب مستقبل Web3' },
  ai_coming_soon_title: { en: 'AI Web3 Agent Wallet', es: 'Billetera Agente Web3 IA', fr: 'Portefeuille Agent Web3 IA', de: 'KI Web3 Agent Wallet', pt: 'Carteira Agente Web3 IA', ru: 'ИИ Web3 Агент Кошелёк', tr: 'AI Web3 Ajan Cüzdan', ar: 'محفظة وكيل Web3 بالذكاء الاصطناعي' },
  ai_coming_soon_desc: { en: 'An intelligent AI Web3 Agent Wallet that manages your wallet on your behalf! Our AI-powered wallet feature is under development and will be available soon.', es: '¡Una billetera agente Web3 IA inteligente que gestiona tu billetera en tu nombre! Nuestra función de billetera con IA está en desarrollo y estará disponible pronto.', fr: 'Un portefeuille agent Web3 IA intelligent qui gère votre portefeuille en votre nom ! Notre fonctionnalité de portefeuille alimentée par IA est en cours de développement et sera bientôt disponible.', de: 'Ein intelligentes KI Web3 Agent Wallet, das Ihre Wallet in Ihrem Namen verwaltet! Unsere KI-gestützte Wallet-Funktion befindet sich in der Entwicklung und wird bald verfügbar sein.', pt: 'Uma carteira agente Web3 IA inteligente que gerencia sua carteira em seu nome! Nossa funcionalidade de carteira com IA está em desenvolvimento e estará disponível em breve.', ru: 'Интеллектуальный ИИ Web3 Агент Кошелёк, который управляет вашим кошельком от вашего имени! Наша функция кошелька на базе ИИ находится в разработке и скоро будет доступна.', tr: 'Cüzdanınızı sizin adınıza yöneten akıllı bir AI Web3 Ajan Cüzdan! AI destekli cüzdan özelliğimiz geliştirilme aşamasında ve yakında kullanıma sunulacak.', ar: 'محفظة وكيل Web3 بالذكاء الاصطناعي التي تدير محفظتك نيابة عنك! ميزة المحفظة المدعومة بالذكاء الاصطناعي قيد التطوير وستكون متاحة قريباً.' },
  ai_features_preview: { en: 'What to Expect', es: 'Qué Esperar', fr: 'À Quoi S\'attendre', de: 'Was Sie Erwarten Können', pt: 'O Que Esperar', ru: 'Что Ожидать', tr: 'Ne Beklenmeli', ar: 'ما يمكن توقعه' },
  ai_feature_agent: { en: 'AI Agent', es: 'Agente IA', fr: 'Agent IA', de: 'KI-Agent', pt: 'Agente IA', ru: 'ИИ Агент', tr: 'AI Ajan', ar: 'وكيل الذكاء الاصطناعي' },
  ai_feature_agent_desc: { en: 'Autonomous wallet management', es: 'Gestión autónoma de billetera', fr: 'Gestion autonome du portefeuille', de: 'Autonome Wallet-Verwaltung', pt: 'Gestão autônoma de carteira', ru: 'Автономное управление кошельком', tr: 'Otonom cüzdan yönetimi', ar: 'إدارة المحفظة المستقلة' },
  ai_feature_wallet: { en: 'Web3 Wallet', es: 'Billetera Web3', fr: 'Portefeuille Web3', de: 'Web3 Wallet', pt: 'Carteira Web3', ru: 'Web3 Кошелёк', tr: 'Web3 Cüzdan', ar: 'محفظة Web3' },
  ai_feature_wallet_desc: { en: 'Multi-chain wallet support', es: 'Soporte multi-cadena', fr: 'Support multi-chaîne', de: 'Multi-Chain Wallet-Unterstützung', pt: 'Suporte multi-cadeia', ru: 'Поддержка мультичейн кошелька', tr: 'Çoklu zincir cüzdan desteği', ar: 'دعم محفظة متعددة السلاسل' },
  ai_feature_secure: { en: 'Secure', es: 'Seguro', fr: 'Sécurisé', de: 'Sicher', pt: 'Seguro', ru: 'Безопасно', tr: 'Güvenli', ar: 'آمن' },
  ai_feature_secure_desc: { en: 'AI-powered security', es: 'Seguridad con IA', fr: 'Sécurité alimentée par IA', de: 'KI-gestützte Sicherheit', pt: 'Segurança com IA', ru: 'Безопасность на базе ИИ', tr: 'AI destekli güvenlik', ar: 'الأمان المدعوم بالذكاء الاصطناعي' },
  ai_feature_automated: { en: 'Automated', es: 'Automatizado', fr: 'Automatisé', de: 'Automatisiert', pt: 'Automatizado', ru: 'Автоматизировано', tr: 'Otomatik', ar: 'آلي' },
  ai_feature_automated_desc: { en: 'Smart transaction management', es: 'Gestión inteligente de transacciones', fr: 'Gestion intelligente des transactions', de: 'Intelligente Transaktionsverwaltung', pt: 'Gestão inteligente de transações', ru: 'Умное управление транзакциями', tr: 'Akıllı işlem yönetimi', ar: 'إدارة المعاملات الذكية' },
};

type I18nContextType = {
  lang: LangCode;
  setLang: (l: LangCode) => void;
  t: (key: keyof typeof dict) => string;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supported: LangCode[] = ['en','es','fr','de','pt','ru','tr','ar'];
  const detect = (typeof navigator !== 'undefined' ? (navigator.language?.slice(0,2) as LangCode) : 'en') || 'en';
  const initial = (typeof localStorage !== 'undefined' && (localStorage.getItem('app_language') as LangCode)) || (supported.includes(detect) ? detect : 'en');
  const [lang, setLangState] = useState<LangCode>(initial);

  const setLang = (l: LangCode) => {
    setLangState(l);
    try {
      localStorage.setItem('app_language', l);
      // Dispatch a custom event for other components to react to language changes
      window.dispatchEvent(new CustomEvent('app:language-change', { detail: { language: l } }));
    } catch {}
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { language?: LangCode } | undefined;
      if (detail?.language && detail.language !== lang) {
        setLang(detail.language);
      }
    };
    window.addEventListener('app:language-change', handler as EventListener);
    return () => window.removeEventListener('app:language-change', handler as EventListener);
  }, [lang]);

  // Auto-detect and switch on browser/Telegram language changes when user hasn't explicitly set a language
  useEffect(() => {
    const isUserSet = (() => {
      try { return localStorage.getItem('app_language_user_set') === '1'; } catch { return false; }
    })();
    if (isUserSet) return;

    const normalize = (code?: string): LangCode => {
      const two = (code || 'en').slice(0,2) as LangCode;
      return (supported.includes(two) ? two : 'en');
    };

    const applyDetected = (code?: string) => {
      const detected = normalize(code || (typeof navigator !== 'undefined' ? navigator.language : 'en'));
      if (detected !== lang) setLang(detected);
    };

    // Initial check
    applyDetected();

    const onLanguageChange = () => applyDetected();
    const onTelegramLanguage = (e: Event) => {
      const detail = (e as CustomEvent).detail as { language?: string } | undefined;
      if (detail?.language) applyDetected(detail.language);
    };

    window.addEventListener('languagechange', onLanguageChange);
    window.addEventListener('app:telegram-language', onTelegramLanguage as EventListener);
    return () => {
      window.removeEventListener('languagechange', onLanguageChange);
      window.removeEventListener('app:telegram-language', onTelegramLanguage as EventListener);
    };
  }, [lang]);

  const t = useMemo(() => {
    return (key: keyof typeof dict) => dict[key]?.[lang] ?? dict[key]?.en ?? String(key);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};


