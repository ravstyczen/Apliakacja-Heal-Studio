import Foundation

enum SessionType: String, Codable, CaseIterable {
    case solo = "Solo"
    case duo = "Duo"
    case trio = "Trio"

    var maxClients: Int {
        switch self {
        case .solo: return 1
        case .duo: return 2
        case .trio: return 3
        }
    }
}

enum RecurringEditMode: String, Codable {
    case single
    case future
    case all
}

struct BookingSignup: Codable, Equatable {
    let firstName: String
    let lastName: String
    let email: String
}

struct Session: Codable, Identifiable, Equatable {
    let id: String
    let calendarEventId: String
    var date: String
    var startTime: String
    var endTime: String
    var type: SessionType
    var instructorId: String
    var instructorName: String
    var instructorColor: String?
    var clientIds: [String]
    var clientNames: [String]
    var isRecurring: Bool
    var recurringGroupId: String?
    var recurringEndDate: String?
    var isOpenSession: Bool
    var bookingToken: String?
    var bookingSignups: [BookingSignup]?

    var startHour: Int {
        Int(startTime.components(separatedBy: ":").first ?? "0") ?? 0
    }

    var displayTime: String {
        "\(startTime) - \(endTime)"
    }
}

struct SessionCreateRequest: Encodable {
    let date: String
    let startTime: String
    let endTime: String
    let type: String
    let instructorId: String
    let instructorName: String
    let clientIds: [String]
    let clientNames: [String]
    let isRecurring: Bool
    let recurringEndDate: String?
    let isOpenSession: Bool
    let bookingToken: String?
}

struct SessionUpdateRequest: Encodable {
    let eventId: String
    let date: String
    let startTime: String
    let endTime: String
    let type: String
    let instructorId: String
    let instructorName: String
    let clientIds: [String]
    let clientNames: [String]
    let isRecurring: Bool
    let recurringEndDate: String?
    let isOpenSession: Bool
    let bookingToken: String?
    let editMode: String?
}

struct SessionCreateResponse: Decodable {
    let id: String
    let calendarEventId: String
}

struct SuccessResponse: Decodable {
    let success: Bool
}
