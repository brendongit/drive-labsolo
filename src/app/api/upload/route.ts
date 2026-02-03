import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { Readable } from 'stream';

interface UploadRequest {
  serviceName: string;
  photos: string[]; // Array de base64
}

export async function POST(request: NextRequest) {
  try {
    const { serviceName, photos }: UploadRequest = await request.json();

    if (!serviceName || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Nome do serviço e fotos são obrigatórios' },
        { status: 400 }
      );
    }

    // Configurar autenticação com Service Account
    let auth;

    // Opção 1: Usar GOOGLE_SERVICE_ACCOUNT_JSON (JSON completo codificado em base64)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const jsonString = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8');
        const credentials = JSON.parse(jsonString);
        auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
      } catch (e) {
        console.error('Erro ao parsear GOOGLE_SERVICE_ACCOUNT_JSON:', e);
        throw new Error('Credenciais JSON inválidas');
      }
    }
    // Opção 2: Usar variáveis separadas
    else {
      let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';

      // Se a chave contém \n literal (como string), converter para quebra de linha real
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
      }

      // Remover aspas extras que podem vir da variável de ambiente
      privateKey = privateKey.replace(/^["']|["']$/g, '');

      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/drive.file'],
      });
    }

    const drive = google.drive({ version: 'v3', auth });

    const parentFolderId = process.env.PARENT_FOLDER_ID as string;

    // Gerar timestamp para o lote de fotos
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    // Upload de todas as fotos direto na pasta compartilhada
    // Nome do arquivo: [NomeServico]_foto_1_[timestamp].jpg
    const uploadResults = [];

    for (let i = 0; i < photos.length; i++) {
      try {
        const base64Data = photos[i];
        // Remove o prefixo data:image/xxx;base64, se existir
        const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Content, 'base64');

        console.log(`Enviando foto ${i + 1}/${photos.length}, tamanho: ${buffer.length} bytes`);

        // Nome inclui o serviço para organização
        const fileName = `[${serviceName}]_foto_${i + 1}_${timestamp}.jpg`;

        const fileMetadata = {
          name: fileName,
          parents: [parentFolderId],
        };

        const media = {
          mimeType: 'image/jpeg',
          body: Readable.from(buffer),
        };

        const file = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, name',
          supportsAllDrives: true,
        });

        console.log(`Foto ${i + 1} enviada: ${file.data.name}`);

        uploadResults.push({
          fileName: file.data.name,
          fileId: file.data.id,
        });
      } catch (photoError: any) {
        console.error(`Erro ao enviar foto ${i + 1}:`, photoError?.message || photoError);
        throw new Error(`Falha ao enviar foto ${i + 1}: ${photoError?.message || 'erro desconhecido'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${photos.length} foto(s) enviada(s) com sucesso`,
      serviceName,
      files: uploadResults,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);

    let errorMessage = 'Erro ao fazer upload das fotos';
    let details = String(error);

    if (error?.message) {
      details = error.message;
    }

    if (error?.response?.data?.error) {
      const driveError = error.response.data.error;
      details = `${driveError.message} (${driveError.status})`;

      if (driveError.status === 'PERMISSION_DENIED') {
        errorMessage = 'Sem permissão. Verifique se a pasta foi compartilhada com a Service Account.';
      } else if (driveError.status === 'NOT_FOUND') {
        errorMessage = 'Pasta não encontrada. Verifique o PARENT_FOLDER_ID.';
      }
    }

    return NextResponse.json(
      { error: errorMessage, details },
      { status: 500 }
    );
  }
}
