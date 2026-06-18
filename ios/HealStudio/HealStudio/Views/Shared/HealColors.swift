import SwiftUI

extension Color {
    static let healBg = Color(hex: "#FAF9F7")
    static let healPrimary = Color(hex: "#2C3E2D")
    static let healAccent = Color(hex: "#B8A88A")
    static let healLight = Color(hex: "#E8E4DE")
    static let healDark = Color(hex: "#1A1A1A")
}

extension ShapeStyle where Self == Color {
    static var healBg: Color { .healBg }
    static var healPrimary: Color { .healPrimary }
    static var healAccent: Color { .healAccent }
    static var healLight: Color { .healLight }
    static var healDark: Color { .healDark }
}
