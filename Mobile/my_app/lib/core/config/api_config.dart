/// API Configuration for the Application
class ApiConfig {
  // --- Environment Settings ---
  static const bool isProduction = false;
  
  // Production Base URL
  static const String _prodBaseUrl = 'https://api.yourdomain.com/api';
  
  // Development Base URL
  // static const String _devBaseUrl = String.fromEnvironment(
  //   'API_BASE_URL',
  //   defaultValue: 'https://earlier-choose-engineer-disclose.trycloudflare.com/api',
  // );

    static const String _devBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8080/api',
  );

    // static const String _devBaseUrl = String.fromEnvironment(
    // 'API_BASE_URL',
    // defaultValue: 'https://backend-v1-m7fk.onrender.com/api',
  // );

  /// Get the active Base URL based on current environment
  static String get baseUrl => isProduction ? _prodBaseUrl : _devBaseUrl;

  // --- Endpoints ---
  static const String login = '/mobilelogin';
  static const String households = '/mobile/households';
  static const String villages = '/mobile/villages';
  static const String profile = '/mobile/profile';
  static const String garbageRates = '/mobile/garbage-rates';
  static const String waterUnits = '/mobile/water-units';
  static const String waterReadings = '/mobile/water-readings';
  static const String garbageReadings = '/mobile/garbage-readings';
  static const String invoices = '/mobile/invoices';
  static const String receipts = '/mobile/receipts';
  static const String paymentsCash = '/payments/cash';
  static const String paymentsPromptpay = '/payments/promptpay';
  static const String paymentsStatus = '/payments/status';
}
