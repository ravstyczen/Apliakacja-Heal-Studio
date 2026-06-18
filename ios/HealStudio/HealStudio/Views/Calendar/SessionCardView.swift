import SwiftUI

struct SessionCardView: View {
    let session: Session
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            HStack(spacing: 2) {
                Text(session.type.rawValue.prefix(1))
                    .font(.system(size: 8, weight: .bold))
                    .foregroundColor(color)

                if session.isRecurring {
                    Image(systemName: "arrow.2.squarepath")
                        .font(.system(size: 6))
                        .foregroundColor(.purple)
                }

                if session.isOpenSession {
                    Image(systemName: "globe")
                        .font(.system(size: 6))
                        .foregroundColor(.green)
                }
            }

            if !session.clientNames.isEmpty {
                Text(session.clientNames.first ?? "")
                    .font(.system(size: 7))
                    .foregroundColor(.healDark)
                    .lineLimit(1)
            }
        }
        .padding(.horizontal, 3)
        .padding(.vertical, 2)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(color.opacity(0.08))
        .overlay(
            Rectangle()
                .fill(color)
                .frame(width: 2),
            alignment: .leading
        )
        .cornerRadius(3)
    }
}
