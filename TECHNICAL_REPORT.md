# Teknik Rapor: Blockchain Tabanlı Sertifika Doğrulama Sistemi

**Tarih:** 30 Kasım 2025
**Durum:** Geliştirme Aşaması
**Hazırlayan:** Geliştirme Ekibi

---

## 1. Yönetici Özeti

Bu proje, eğitim sertifikalarının veya başarı belgelerinin blokzincir teknolojisi kullanılarak güvenli, değiştirilemez ve doğrulanabilir bir şekilde saklanmasını sağlayan dağıtık bir sistemdir. Kişisel Verilerin Korunması Kanunu (KVKK) ve GDPR uyumluluğu gözetilerek tasarlanmış olup, hassas kişisel verileri zincir üzerinde açık bir şekilde saklamaz; bunun yerine kriptografik özet (hash) yöntemlerini kullanır.

## 2. Sistem Mimarisi

Sistem, konteynerize edilmiş (Docker) üç ana bileşenden oluşmaktadır:

1.  **Blockchain Ağı (Ganache):** Yerel geliştirme ve test işlemleri için kullanılan, Ethereum uyumlu özel blokzincir ağı.
2.  **Akıllı Sözleşme Katmanı (Hardhat):** Solidity ile yazılmış iş mantığını barındıran, sözleşmelerin derlenmesi ve ağa dağıtılmasından sorumlu katman.
3.  **İstemci Uygulaması (Client):** Node.js ve TypeScript ile geliştirilmiş, son kullanıcıların (veya kurumların) blokzincir ile etkileşime girmesini sağlayan komut satırı arayüzü (CLI).

### Teknoloji Yığını

- **Dil:** Solidity (v0.8.20), TypeScript
- **Framework:** Hardhat, Ethers.js
- **Altyapı:** Docker & Docker Compose
- **Ağ:** EVM (Ethereum Virtual Machine)

---

## 3. Akıllı Sözleşme Detayları (`CertificateRegistry.sol`)

Sistemin kalbi olan `CertificateRegistry` sözleşmesi, sertifikaların yaşam döngüsünü yönetir.

### 3.1. Veri Yapısı

Her sertifika (`Certificate` struct) zincir üzerinde şu verileri tutar:

- **id (`bytes32`):** Sertifikanın benzersiz tanımlayıcısı.
- **holderHash (`bytes32`):** Öğrenci no, isim ve tuz (salt) değerinin şifrelenmiş hali. Kişisel veriyi gizler.
- **title (`string`):** Sertifika başlığı (Örn: "Mezuniyet Belgesi").
- **issuer (`string`):** Belgeyi veren kurum.
- **issuedAt (`uint64`):** Veriliş zamanı (Timestamp).
- **expiresAt (`uint64`):** Varsa son geçerlilik tarihi (Yoksa 0).
- **revoked (`bool`):** İptal durumu.

### 3.2. Fonksiyonlar

- `issue(...)`: Sadece sözleşme sahibi (Owner) tarafından çağrılabilir. Yeni bir sertifika oluşturur.
- `revoke(...)`: Verilmiş bir sertifikayı iptal eder (Örn: Disiplin suçu veya hatalı basım durumunda).
- `verify(...)`: Herkes tarafından çağrılabilir. Girilen bilgiler ile zincirdeki hash'i karşılaştırır ve geçerliliği döner.

---

## 4. Gizlilik ve Güvenlik Yaklaşımı (Data Minimization)

Bu proje, blokzincirin şeffaflığı ile kullanıcı gizliliği arasındaki dengeyi "Off-Chain Hashing" (Zincir Dışı Özetleme) yöntemiyle sağlar.

### 4.1. Hash Mekanizması

Kişisel veriler (İsim, Öğrenci No) hiçbir zaman düz metin (plaintext) olarak blokzincire gönderilmez. İstemci tarafında şu işlem uygulanır:

$$ Hash = \text{Keccak256}(\text{OgrNo} + "|" + \text{Isim} + "|" + \text{Salt}) $$

- **Salt (Tuz):** Her sertifika için rastgele üretilen 16 byte'lık bir değerdir. Bu, "Rainbow Table" saldırılarına karşı koruma sağlar ve aynı isme sahip kişilerin hash'lerinin farklı olmasını garanti eder.

### 4.2. Doğrulama Süreci

Bir sertifikanın doğrulanabilmesi için şu 3 bilginin doğrulamayı yapan tarafa (işveren, okul vb.) sunulması gerekir:

1.  Sertifika ID'si
2.  Kişisel Bilgiler (Öğrenci No ve İsim)
3.  Salt (Tuz) Değeri

Akıllı sözleşme, bu girdileri alıp tekrar hash'ler ve saklanan `holderHash` ile eşleşip eşleşmediğini kontrol eder.

---

## 5. İş Akışları

### 5.1. Sertifika Oluşturma (Issue)

1.  Kurum yetkilisi öğrenci bilgilerini girer.
2.  İstemci uygulaması rastgele bir `salt` üretir.
3.  İstemci `holderHash`'i hesaplar.
4.  Sadece `id`, `holderHash` ve genel bilgiler (başlık) blokzincire yazılır.
5.  **Önemli:** Üretilen `salt` değeri kullanıcıya güvenli bir şekilde (e-posta, kağıt çıktı vb.) iletilmelidir.

### 5.2. Sertifika Doğrulama (Verify)

1.  Doğrulayıcı, öğrencinin sağladığı `salt` ve kimlik bilgilerini sisteme girer.
2.  Sözleşme, sertifikanın iptal edilip edilmediğini (`revoked`) ve süresinin dolup dolmadığını kontrol eder.
3.  Hash eşleşmesi sağlanırsa sertifika geçerli sayılır.

---

## 6. Kurulum ve Çalıştırma

Sistem Docker üzerinde çalışacak şekilde yapılandırılmıştır.

**Gereksinimler:** Docker Desktop

**Adımlar:**

1.  Servisleri başlatın:
    ```bash
    docker-compose up -d
    ```
2.  Akıllı sözleşmeyi ağa dağıtın (Deploy):
    ```bash
    docker-compose exec hardhat npx hardhat run scripts/deploy.js --network localhost
    ```
3.  İstemci üzerinden işlem yapın:
    ```bash
    # Sertifika Oluşturma
    docker-compose exec client npx ts-node src/index.ts issue cert123 101 "Ahmet Yilmaz" "Solana Bootcamp" "Patika"
    ```

## 7. Sonuç ve Gelecek Çalışmalar

Bu sistem, merkeziyetsiz güven mimarisi üzerine kurulmuş, ölçeklenebilir ve gizlilik odaklı bir çözümdür.

**Geliştirilebilecek Alanlar:**

- **IPFS Entegrasyonu:** Sertifika PDF'inin veya görselinin IPFS üzerinde saklanması.
- **Çoklu İmza (Multi-Sig):** Sertifika verirken birden fazla yetkilinin onayının istenmesi.
- **Web Arayüzü:** CLI yerine React tabanlı bir kullanıcı arayüzü geliştirilmesi.
