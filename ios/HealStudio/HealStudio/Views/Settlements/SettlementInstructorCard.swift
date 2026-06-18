import SwiftUI

struct SettlementInstructorCard: View {
    let settlement: MonthlySettlement
    let instructorColor: Color
    let isExpanded: Bool
    let onToggle: () -> Void

    var body: some View {
        VStack(spacing: 0) {
            Button(action: onToggle) {
                HStack(spacing: 12) {
                    Text(String(settlement.instructorName.prefix(1)))
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 40, height: 40)
                        .background(instructorColor)
                        .clipShape(Circle())

                    VStack(alignment: .leading, spacing: 2) {
                        Text(settlement.instructorName)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.healDark)

                        Text("\(settlement.totalHours) godz. | \(settlement.totalPrice) zl | Udzial: \(settlement.totalShare) zl")
                            .font(.system(size: 12))
                            .foregroundColor(.gray)
                    }

                    Spacer()

                    Image(systemName: "chevron.down")
                        .font(.system(size: 14))
                        .foregroundColor(.gray)
                        .rotationEffect(.degrees(isExpanded ? 180 : 0))
                }
                .padding(16)
            }

            if isExpanded {
                Divider()
                    .padding(.horizontal, 16)

                sessionsTable
            }
        }
        .background(Color.white)
        .cornerRadius(12)
    }

    private var sessionsTable: some View {
        VStack(spacing: 0) {
            HStack {
                Text("Data").frame(maxWidth: .infinity, alignment: .leading)
                Text("Godz.").frame(width: 50, alignment: .leading)
                Text("Rodzaj").frame(width: 50, alignment: .leading)
                Text("Cena").frame(width: 55, alignment: .trailing)
                Text("Udzial").frame(width: 55, alignment: .trailing)
            }
            .font(.system(size: 11, weight: .medium))
            .foregroundColor(.gray)
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            ForEach(settlement.sessions) { session in
                HStack {
                    Text(session.date).frame(maxWidth: .infinity, alignment: .leading)
                    Text(session.time.isEmpty ? "-" : session.time).frame(width: 50, alignment: .leading)
                    Text(session.sessionType.rawValue).frame(width: 50, alignment: .leading)
                    Text("\(session.price) zl").frame(width: 55, alignment: .trailing)
                    Text("\(session.instructorShare) zl").frame(width: 55, alignment: .trailing)
                }
                .font(.system(size: 11))
                .foregroundColor(.healDark)
                .padding(.horizontal, 16)
                .padding(.vertical, 6)

                Divider()
                    .padding(.horizontal, 16)
            }

            HStack {
                Text("Razem")
                    .font(.system(size: 12, weight: .semibold))
                Spacer()
                Text("\(settlement.totalPrice) zl")
                    .font(.system(size: 12, weight: .semibold))
                    .frame(width: 55, alignment: .trailing)
                Text("\(settlement.totalShare) zl")
                    .font(.system(size: 12, weight: .semibold))
                    .frame(width: 55, alignment: .trailing)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
    }
}
