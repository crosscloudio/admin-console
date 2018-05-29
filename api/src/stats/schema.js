export const schema = [
  `

type DailyUsageStats {
  # A name of a day of the week (Sunday, ...)
  day: String!
  count: Float
  traffic: Float
}

type EncryptionStats {
  encrypted_files: Float
  not_encrypted_files: Float
}

type Stats {
  active_users_today: Float
  encryption_status: EncryptionStats
  file_type_usage: [UsageStats]
  policy_usage: [UsageStats]
  sync_operations_status: [UsageStats]
  traffic_stats: [TrafficStats]
  usage_last_week: [DailyUsageStats]
  used_storages: [UsedStorageStats]
}

type TrafficStats {
  type: String!
  count: Float
  traffic: Float
}

type UsageStats {
  type: String!
  count: Float
}

type UsedStorageStats {
  name: String!
  count: Float
  percentage: Float
}

`,
];
