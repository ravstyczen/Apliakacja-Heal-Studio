import Foundation

enum SettlementsAPI {
    static func fetchMonthly(month: String, instructorId: String? = nil) async throws -> [MonthlySettlement] {
        var queryItems = [
            URLQueryItem(name: "view", value: "monthly"),
            URLQueryItem(name: "month", value: month),
        ]
        if let instructorId {
            queryItems.append(URLQueryItem(name: "instructorId", value: instructorId))
        }
        return try await APIClient.shared.request(.get, path: "/api/settlements", queryItems: queryItems)
    }

    static func sync() async throws -> SyncResponse {
        try await APIClient.shared.request(.post, path: "/api/settlements/sync")
    }
}
