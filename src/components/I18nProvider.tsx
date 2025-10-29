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
  total_rzc_balance: { en: 'Total RZC Balance', es: 'Saldo total de RZC', fr: 'Solde total RZC', de: 'Gesamtsaldo RZC', pt: 'Saldo total de RZC', ru: 'Общий баланс RZC', tr: 'Toplam RZC Bakiyesi', ar: 'إجمالي رصيد RZC' },
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
  feature_fast: { en: 'Fast', es: 'Rápido', fr: 'Rapide', de: 'Schnell', pt: 'Rápido', ru: 'Быстро', tr: 'Hızlı', ar: 'سريع' },
  feature_ecosystem: { en: 'Ecosystem', es: 'Ecossistema', fr: 'Écosystème', de: 'Ökosystem', pt: 'Ecossistema', ru: 'Экосистема', tr: 'Ekosistem', ar: 'النظام البيئي' },
  feature_jettons: { en: 'Jettons', es: 'Jettons', fr: 'Jettons', de: 'Jettons', pt: 'Jettons', ru: 'Джеттоны', tr: 'Jettonlar', ar: 'Jettons' },
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


