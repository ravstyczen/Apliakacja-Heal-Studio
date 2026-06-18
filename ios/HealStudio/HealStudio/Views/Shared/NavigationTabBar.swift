import SwiftUI

enum AppTab: String, CaseIterable {
    case calendar
    case clients
    case settlements
    case instructors

    var title: String {
        switch self {
        case .calendar: return "Kalendarz"
        case .clients: return "Klienci"
        case .settlements: return "Rozliczenia"
        case .instructors: return "Instruktorzy"
        }
    }

    var icon: String {
        switch self {
        case .calendar: return "calendar"
        case .clients: return "person.2"
        case .settlements: return "chart.bar"
        case .instructors: return "gearshape"
        }
    }
}

struct NavigationTabBar: View {
    @Binding var activeTab: AppTab
    let isAdmin: Bool

    var visibleTabs: [AppTab] {
        if isAdmin {
            return AppTab.allCases
        }
        return [.calendar, .clients]
    }

    var body: some View {
        HStack {
            ForEach(visibleTabs, id: \.self) { tab in
                Button {
                    activeTab = tab
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.icon)
                            .font(.system(size: 20))

                        Text(tab.title)
                            .font(.system(size: 10, weight: .medium))

                        Circle()
                            .fill(activeTab == tab ? Color.healPrimary : .clear)
                            .frame(width: 4, height: 4)
                    }
                    .foregroundColor(activeTab == tab ? .healPrimary : .gray)
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .padding(.horizontal)
        .padding(.top, 8)
        .padding(.bottom, 4)
        .background(
            Color.healBg
                .shadow(color: .black.opacity(0.05), radius: 4, y: -2)
                .ignoresSafeArea(edges: .bottom)
        )
    }
}
