import SwiftUI

struct RecurringEditSheet: View {
    let title: String
    let onSelect: (RecurringEditMode) -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.healDark)
                .padding(.top, 24)
                .padding(.bottom, 20)

            VStack(spacing: 12) {
                Button {
                    onSelect(.single)
                    dismiss()
                } label: {
                    Text("Tylko ta sesja")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.healPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.healPrimary.opacity(0.1))
                        .cornerRadius(12)
                }

                Button {
                    onSelect(.future)
                    dismiss()
                } label: {
                    Text("Ta i przyszle sesje")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.healPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.healPrimary.opacity(0.1))
                        .cornerRadius(12)
                }

                Button {
                    onSelect(.all)
                    dismiss()
                } label: {
                    Text("Wszystkie sesje")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.healPrimary)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.healPrimary.opacity(0.1))
                        .cornerRadius(12)
                }
            }
            .padding(.horizontal, 24)

            Button {
                dismiss()
            } label: {
                Text("Anuluj")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundColor(.gray)
            }
            .padding(.top, 20)
            .padding(.bottom, 24)
        }
        .presentationDetents([.height(320)])
    }
}
