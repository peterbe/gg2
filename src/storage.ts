const db = Bun.file("~/.gg/db.json");

export function storeTitle(branchName: string, title: string): Promise<void> {
    return new Promise((resolve, reject) => {
        // Simulate storing the title
        console.log(`Storing title "${title}" for branch "${branchName}"`);
        resolve();
    });
}