import WidgetKit
import SwiftUI

// Define the data structure matching lib/widget.ts
struct WidgetCat: Codable, Identifiable {
    let id: Int
    let name: String
    let distance: String
    let lastFed: String?
    let status: String?
    let image: String?
}

struct WidgetData: Codable {
    let totalNearby: Int
    let cats: [WidgetCat]
    let lastUpdated: String
}

struct Provider: AppIntentTimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: ConfigurationAppIntent(), data: nil)
    }

    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> SimpleEntry {
        SimpleEntry(date: Date(), configuration: configuration, data: loadData())
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<SimpleEntry> {
        let entries = [SimpleEntry(date: Date(), configuration: configuration, data: loadData())]
        // Reload every 15 minutes as a fallback, but app should trigger reload
        return Timeline(entries: entries, policy: .after(Date().addingTimeInterval(900)))
    }
    
    func loadData() -> WidgetData? {
        let userDefaults = UserDefaults(suiteName: "group.com.mmdev.pokecats")
        // ExtensionStorage stores JSON as a string, not Data
        if let jsonString = userDefaults?.string(forKey: "widgetData"),
           let jsonData = jsonString.data(using: .utf8) {
            let decoder = JSONDecoder()
            return try? decoder.decode(WidgetData.self, from: jsonData)
        }
        return nil
    }
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let configuration: ConfigurationAppIntent
    let data: WidgetData?
}

struct widgetEntryView : View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        Group {
            if let data = entry.data {
                if data.totalNearby == 0 {
                    EmptyStateView()
                } else {
                    switch family {
                    case .systemSmall:
                        SmallView(data: data)
                    case .systemMedium:
                        MediumView(data: data)
                    case .systemLarge:
                        LargeView(data: data)
                    default:
                        SmallView(data: data)
                    }
                }
            } else {
                EmptyStateView(message: "Open app to sync")
            }
        }
        .widgetURL(URL(string: "exp+pokecats://"))
    }
}

struct EmptyStateView: View {
    var message: String = "No cats nearby"
    
    var body: some View {
        ZStack {
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.23, green: 0.56, blue: 0.76),
                    Color(red: 0.17, green: 0.49, blue: 0.71)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            
            VStack {
                Text("🐱")
                    .font(.largeTitle)
                Text(message)
                    .font(.caption)
                    .bold()
                    .foregroundColor(.white.opacity(0.8))
            }
        }
        .containerBackground(.clear, for: .widget)
    }
}

struct SmallView: View {
    let data: WidgetData
    
    // Calculate cats that may need food (fed > 8 hours ago or never)
    var hungryCount: Int {
        data.cats.filter { cat in
            guard let lastFed = cat.lastFed else { return true }
            let formatter = ISO8601DateFormatter()
            guard let fedDate = formatter.date(from: lastFed) else { return true }
            return Date().timeIntervalSince(fedDate) > 8 * 60 * 60
        }.count
    }
    
    var body: some View {
        ZStack {
            // Purple/magenta gradient background (matching Figma)
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.80, green: 0.35, blue: 0.68), // #CC59AD - pink/magenta top
                    Color(red: 0.55, green: 0.20, blue: 0.55)  // #8C3389 - purple bottom
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            
            VStack(spacing: 0) {
                // Cat images cluster (upper area)
                ZStack {
                    // White cat (left, largest)
                    Image("LabCat")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 70, height: 70)
                        .offset(x: -30, y: 8)
                    
                    // Black cat (center, laying down)
                    Image("LabCat-2")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .offset(x: 0, y: 20)
                    
                    // Orange cat (right)
                    Image("LabCat-1")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 50, height: 50)
                        .offset(x: 35, y: 0)
                }
                .frame(height: 80)
                .padding(.top, 8)
                
                Spacer()
                
                // Footer text: "X cats nearby"
                HStack(spacing: 6) {
                    Text("\(data.totalNearby)")
                        .font(.system(size: 28, weight: .bold))
                        .foregroundColor(Color(red: 0.75, green: 1.0, blue: 0.0)) // Lime green
                    Text("cats nearby")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(Color(red: 0.75, green: 1.0, blue: 0.0))
                }
                .minimumScaleFactor(0.7)
                .lineLimit(1)
                
                // "X may need food"
                HStack(spacing: 4) {
                    Text("\(hungryCount)")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(Color(red: 0.75, green: 1.0, blue: 0.0))
                    Text("may need food")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundColor(.white.opacity(0.9))
                }
                .padding(.bottom, 12)
            }
            .padding(.horizontal, 8)
        }
        .containerBackground(.clear, for: .widget)
    }
}

struct MediumView: View {
    let data: WidgetData
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("🐾 Nearby")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Text("\(data.totalNearby)")
                    .font(.system(size: 34, weight: .bold))
                    .foregroundColor(Color(red: 0.2, green: 0.78, blue: 0.35))
                
                Text(data.totalNearby == 1 ? "cat found" : "cats found")
                    .font(.caption)
                    .fontWeight(.bold)
                    .foregroundColor(.white)
            }
            .padding(.trailing)
            
            Divider().background(Color.gray)
            
            VStack(alignment: .leading, spacing: 6) {
                if let cat = data.cats.first {
                    CatRow(cat: cat)
                    if data.cats.count > 1 {
                        Text("+\(data.cats.count - 1) more")
                            .font(.caption2)
                            .foregroundColor(.gray)
                    }
                }
            }
        }
        .containerBackground(Color(red: 0.1, green: 0.14, blue: 0.2), for: .widget)
    }
}

struct LargeView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("🐾 Cats Nearby")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Text("\(data.totalNearby)")
                    .font(.headline)
                    .foregroundColor(Color(red: 0.2, green: 0.78, blue: 0.35))
            }
            
            Divider().background(Color.white.opacity(0.2))
            
            ForEach(data.cats.prefix(4)) { cat in
                CatRow(cat: cat)
            }
            
            Spacer()
        }
        .containerBackground(Color(red: 0.1, green: 0.14, blue: 0.2), for: .widget)
    }
}

struct CatRow: View {
    let cat: WidgetCat
    
    var statusColor: Color {
        switch (cat.status ?? "").lowercased() {
        case "needs help": return .red
        case "healthy": return .green
        default: return .yellow
        }
    }
    
    var body: some View {
        HStack {
            // AsyncImage works in widgets iOS 15+
            if let imageUrl = cat.image, let url = URL(string: imageUrl) {
                 AsyncImage(url: url) { image in
                     image.resizable().aspectRatio(contentMode: .fill)
                 } placeholder: {
                     Color.gray
                 }
                 .frame(width: 30, height: 30)
                 .clipShape(Circle())
            } else {
                Circle()
                    .fill(Color.gray)
                    .frame(width: 30, height: 30)
            }
            
            VStack(alignment: .leading) {
                Text(cat.name)
                    .font(.caption)
                    .bold()
                    .foregroundColor(.white)
                Text(cat.distance)
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
        }
    }
}

struct widget: Widget {
    let kind: String = "widget"

    var body: some WidgetConfiguration {
        AppIntentConfiguration(kind: kind, intent: ConfigurationAppIntent.self, provider: Provider()) { entry in
            widgetEntryView(entry: entry)
        }
        .configurationDisplayName("Cats Nearby")
        .description("See cats currently near you.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

extension ConfigurationAppIntent {
    fileprivate static var smiley: ConfigurationAppIntent {
        let intent = ConfigurationAppIntent()
        intent.favoriteEmoji = "😀"
        return intent
    }
}

#Preview(as: .systemSmall) {
    widget()
} timeline: {
    SimpleEntry(date: .now, configuration: .smiley, data: WidgetData(totalNearby: 5, cats: [
        WidgetCat(id: 1, name: "Lollipop", distance: "50m", lastFed: nil, status: "Healthy", image: nil)
    ], lastUpdated: ""))
}
