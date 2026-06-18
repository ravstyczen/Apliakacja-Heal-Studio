import Foundation

struct Settlement: Codable, Identifiable, Equatable {
    let id: String
    let date: String
    let time: String
    let sessionType: SessionType
    let instructorId: String
    let instructorName: String
    let clientNames: [String]
    let price: Int
    let instructorShare: Int
}

struct MonthlySettlement: Codable, Identifiable, Equatable {
    let month: String
    let instructorId: String
    let instructorName: String
    let totalHours: Int
    let totalPrice: Int
    let totalShare: Int
    let sessions: [Settlement]

    var id: String { "\(month)-\(instructorId)" }
}

struct SyncResponse: Decodable {
    let synced: Int
    let total: Int
}
