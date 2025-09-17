class AppConfig {
  // Backend API Configuration
  static const String _localBackendUrl = 'http://localhost:3000';
  static const String _productionBackendUrl = 'https://moodsync-backend-837735180311.asia-south1.run.app';
  
  // Environment detection
  static const bool _isProduction = bool.fromEnvironment('dart.vm.product');
  
  // Get the appropriate backend URL based on environment
  static String get backendUrl {
    return _productionBackendUrl; // Always use production URL now
  }
  
  // API Endpoints
  static String get registerUrl => '$backendUrl/register';
  static String get loginUrl => '$backendUrl/login';
  static String get usersUrl => '$backendUrl/users';
  static String get healthUrl => '$backendUrl/health';
  
  // AI Service Endpoints
  static String get aiGirlfriendMotivationalUrl => '$backendUrl/api/ai-girlfriend/motivational';
  static String get aiGirlfriendGreetingUrl => '$backendUrl/api/ai-girlfriend/greeting';
  static String get aiGirlfriendTaskCompletionUrl => '$backendUrl/api/ai-girlfriend/task-completion';
  static String get aiGirlfriendAllTasksCompletedUrl => '$backendUrl/api/ai-girlfriend/all-tasks-completed';
  static String get aiGirlfriendChatUrl => '$backendUrl/api/ai-girlfriend/chat';
  static String get wellnessCoachAdviceUrl => '$backendUrl/api/wellness-coach/advice';
  static String get moodChatSupportUrl => '$backendUrl/api/mood-chat/support';
  
  // Socket.IO Configuration
  static String get socketUrl => backendUrl;
  
  // Debug settings
  static const bool enableDebugLogs = !_isProduction;
  
  // Print current configuration (for debugging)
  static void printConfig() {
    if (enableDebugLogs) {
      print('🔧 App Configuration:');
      print('   Environment: ${_isProduction ? "Production" : "Development"}');
      print('   Backend URL: $backendUrl');
      print('   Socket URL: $socketUrl');
    }
  }
}
