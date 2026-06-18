import Foundation

struct Client: Codable, Identifiable, Equatable {
    let id: String
    var firstName: String
    var lastName: String
    var phone: String
    var email: String
    var isOwnerClient: Bool
    var regulationsAccepted: Bool
    var regulationsAcceptedDate: String?

    var fullName: String {
        "\(firstName) \(lastName)"
    }

    var initials: String {
        let f = firstName.first.map(String.init) ?? ""
        let l = lastName.first.map(String.init) ?? ""
        return f + l
    }

    var formattedPhone: String {
        let digits = phone.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        if digits.count == 9 {
            let p1 = digits.prefix(3)
            let p2 = digits.dropFirst(3).prefix(3)
            let p3 = digits.dropFirst(6)
            return "+48 \(p1) \(p2) \(p3)"
        }
        if digits.count == 11, digits.hasPrefix("48") {
            let d = digits.dropFirst(2)
            let p1 = d.prefix(3)
            let p2 = d.dropFirst(3).prefix(3)
            let p3 = d.dropFirst(6)
            return "+48 \(p1) \(p2) \(p3)"
        }
        return phone
    }
}

struct ClientCreateRequest: Encodable {
    let firstName: String
    let lastName: String
    let phone: String
    let email: String
    let isOwnerClient: Bool
}
