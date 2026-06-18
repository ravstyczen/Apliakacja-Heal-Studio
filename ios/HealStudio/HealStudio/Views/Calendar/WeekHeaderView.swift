import SwiftUI

struct WeekHeaderView: View {
    let days: [Date]

    var body: some View {
        HStack(spacing: 0) {
            Text("")
                .frame(width: 40)

            ForEach(days, id: \.self) { day in
                let isToday = CalendarViewModel.isToday(day)

                VStack(spacing: 2) {
                    Text(CalendarViewModel.dayAbbreviation(day))
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(isToday ? .healPrimary : .gray)

                    Text(CalendarViewModel.dayNumber(day))
                        .font(.system(size: 14, weight: isToday ? .bold : .medium))
                        .foregroundColor(isToday ? .white : .healDark)
                        .frame(width: 28, height: 28)
                        .background(
                            Circle()
                                .fill(isToday ? Color.healPrimary : .clear)
                        )
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding(.vertical, 8)
        .background(Color.healBg)
    }
}
