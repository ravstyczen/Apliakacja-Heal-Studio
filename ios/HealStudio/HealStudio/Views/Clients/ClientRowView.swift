import SwiftUI

struct ClientRowView: View {
    let client: Client
    let isAdmin: Bool

    var body: some View {
        HStack(spacing: 12) {
            Text(client.initials)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.healPrimary)
                .frame(width: 40, height: 40)
                .background(Color.healPrimary.opacity(0.1))
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(client.fullName)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.healDark)

                    if client.isOwnerClient && isAdmin {
                        Text("VIP")
                            .font(.system(size: 9, weight: .medium))
                            .foregroundColor(.healAccent)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.healAccent.opacity(0.2))
                            .cornerRadius(8)
                    }
                }

                if !client.phone.isEmpty {
                    Text(client.formattedPhone)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }

                if !client.email.isEmpty {
                    Text(client.email)
                        .font(.system(size: 12))
                        .foregroundColor(.gray)
                }
            }

            Spacer()

            if client.regulationsAccepted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.green)
            } else {
                Image(systemName: "exclamationmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(.orange)
            }
        }
        .padding(.vertical, 4)
    }
}
