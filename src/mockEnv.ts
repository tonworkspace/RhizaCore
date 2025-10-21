import {
  mockTelegramEnv,
  isTMA,
  parseInitData,
  LaunchParams, retrieveLaunchParams
} from '@telegram-apps/sdk-react';

// It is important, to mock the environment only for development purposes.
// When building the application the import.meta.env.DEV will value become
// `false` and the code inside will be tree-shaken (removed), so you will not
// see it in your final bundle.
if (import.meta.env.DEV) {
  await (async () => {
    if (await isTMA()) {
      return;
    }

    // Determine which launch params should be applied. We could already
    // apply them previously, or they may be specified on purpose using the
    // default launch parameters transmission method.
    let lp: LaunchParams | undefined;
    try {
      lp = retrieveLaunchParams();
    } catch (e) {
      // const initDataRaw = new URLSearchParams([
      //   ['user', JSON.stringify({
      //     id: 923484467,
      //     first_name: 'Sarah',
      //     last_name: 'Jonna',
      //     username: 'sajonna',
      //     language_code: 'en',
      //     is_premium: false,
      //     allows_write_to_pm: true,
      //   })],
      //   ['hash', 'x7y9z2a4b6c8d0e2f4g6h8i0j2k4m6n8p088'],
      //   ['auth_date', '1712277777'],
      //   ['start_param', 'debug'],
      //   ['chat_type', 'sender'],
      //   ['chat_instance', '9876543210123456744'],
      //   ['signature', 'a2b4c6d8t5f2g4h6i8j0k2m4n6p8q0'],
      // ]).toString();

      const initDataRaw = new URLSearchParams([
        ['user', JSON.stringify({
          id: 923481567,
          first_name: 'Sarah',
          last_name: 'Johnson',
          username: 'sarahj',
          language_code: 'en',
          is_premium: false,
          allows_write_to_pm: true,
        })],
        ['hash', 'x7y9z2a4b6c8d0e2f4g6h8i0j2k4m6n8p0q2'],
        ['auth_date', '1711777777'],
        ['start_param', 'debug'],
        ['chat_type', 'sender'],
        ['chat_instance', '9876543210123456789'],
        ['signature', 'a2b4c6d8e0f2g4h6i8j0k2m4n6p8q0'],
      ]).toString();

      lp = {
        themeParams: {
          accentTextColor: '#6ab2f2',
          bgColor: '#17212b',
          buttonColor: '#5288c1',
          buttonTextColor: '#ffffff',
          destructiveTextColor: '#ec3942',
          headerBgColor: '#17212b',
          hintColor: '#708499',
          linkColor: '#6ab3f3',
          secondaryBgColor: '#232e3c',
          sectionBgColor: '#17212b',
          sectionHeaderTextColor: '#6ab3f3',
          subtitleTextColor: '#708499',
          textColor: '#f5f5f5',
        },
        initData: parseInitData(initDataRaw),
        initDataRaw,
        version: '8',
        platform: 'tdesktop',
      }
    }

    mockTelegramEnv(lp);
    console.warn(
      '⚠️ As long as the current environment was not considered as the Telegram-based one, it was mocked. Take a note, that you should not do it in production and current behavior is only specific to the development process. Environment mocking is also applied only in development mode. So, after building the application, you will not see this behavior and related warning, leading to crashing the application outside Telegram.',
    );
  })();
}
