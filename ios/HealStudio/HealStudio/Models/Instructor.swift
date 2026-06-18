import Foundation

enum InstructorRole: String, Codable, CaseIterable {
    case owner
    case admin
    case instructor

    var displayName: String {
        switch self {
        case .owner: return "Wlasciciel"
        case .admin: return "Admin"
        case .instructor: return "Instruktor"
        }
    }

    var isAdminOrOwner: Bool {
        self == .owner || self == .admin
    }
}

struct InstructorPricingTier: Codable, Equatable {
    var price: Int
    var share: Int
}

struct InstructorPricing: Codable, Equatable {
    var solo: InstructorPricingTier
    var duo: InstructorPricingTier
    var trio: InstructorPricingTier

    func price(for type: SessionType) -> Int {
        switch type {
        case .solo: return solo.price
        case .duo: return duo.price
        case .trio: return trio.price
        }
    }

    func share(for type: SessionType) -> Int {
        switch type {
        case .solo: return solo.share
        case .duo: return duo.share
        case .trio: return trio.share
        }
    }
}

struct Instructor: Codable, Identifiable, Equatable {
    let id: String
    var name: String
    var email: String
    var color: String
    var colorName: String
    var role: InstructorRole
    var pricing: InstructorPricing

    var firstName: String {
        name.components(separatedBy: " ").first ?? name
    }

    var initials: String {
        name.components(separatedBy: " ")
            .compactMap { $0.first.map(String.init) }
            .joined()
    }

    var uiColor: Color {
        Color(hex: color)
    }
}

import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
