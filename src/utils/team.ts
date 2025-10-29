export function getTeamColor(userAddress: string): string {
    // if userAddress ends with even digit, return blue, else return red
    const lastChar = userAddress.slice(-1);
    const lastDigit = parseInt(lastChar, 16); 

    return lastDigit % 2 === 0 ? '#4F726C' : '#9A8A9F';
}